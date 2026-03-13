from __future__ import annotations

import math
import uuid

from app.models.schemas import (
    DetailResponse,
    NodePayload,
    PathRecord,
    PositionedNode,
    SummaryResponse,
    UserProfile,
)
from app.services.bedrock_client import BedrockClient
from app.services.opensearch_client import OpenSearchClient
from app.services.s3_client import S3Client
from app.sources import (
    InstagramPublicImportAdapter,
    LinkedInPublicImportAdapter,
    LocalSeedDataAdapter,
    UofTPublicSitesAdapter,
)


class PathwayEngine:
    def __init__(self) -> None:
        self.bedrock = BedrockClient()
        self.search = OpenSearchClient()
        self.s3 = S3Client()
        self.seed = LocalSeedDataAdapter()
        self.uoft_sites = UofTPublicSitesAdapter()
        self.linkedin_imports = LinkedInPublicImportAdapter()
        self.instagram_imports = InstagramPublicImportAdapter()
        self.opportunities = self._load_opportunities()
        self.search.index_documents(self.opportunities)

    def initialize_path(self, profile: UserProfile) -> PathRecord:
        root_story = self.bedrock.build_root_narrative(profile)
        root = PositionedNode(
            id=f"node-{uuid.uuid4().hex[:8]}",
            title=root_story["title"],
            type="interest",
            short_summary=root_story["short_summary"],
            detailed_summary=root_story["detailed_summary"],
            skills_gained=profile.skills[:3],
            why_it_matters=(
                f"This anchor reflects your {profile.campus} context, {profile.program or 'program'}, and the direction you want to build next."
            ),
            logical_next_step="Explore the surrounding UofT opportunities and open one that feels like the right next move.",
            confidence=0.96,
            source="Academic GPS personalization layer",
            source_url="",
            campus=profile.campus,
            faculty=profile.program,
            tags=profile.interests[:4] + profile.preferred_opportunity_types[:2],
            eligibility=f"Optimized for {profile.year or 'current'} UofT students.",
            related_roles=profile.desired_careers[:3],
            related_skills=profile.desired_skills[:4],
            quick_actions=[
                "Single-click a bubble to inspect the fit.",
                "Double-click a bubble to commit it to your path.",
                "Compare branches before choosing the strongest next move.",
            ],
            x=0,
            y=0,
            depth=0,
            visited=True,
            active=True,
            path_ids=[],
            end_cap=False,
        )
        branch_nodes = self._generate_next_options(root, profile, existing_nodes=[])
        nodes = [root, *branch_nodes]
        return PathRecord(
            id=f"path-{uuid.uuid4().hex[:8]}",
            name=self._path_name(profile),
            profile=profile,
            nodes=nodes,
            active_node_id=root.id,
            breadcrumbs=[root.title],
            summary_ready=False,
        )

    def expand_path(self, path: PathRecord, from_node_id: str, selected_node_id: str) -> tuple[PathRecord, str]:
        active = self._get_node(path, selected_node_id)
        parent = self._get_node(path, from_node_id)
        self._clear_active(path)
        active.active = True
        active.visited = True
        if from_node_id != selected_node_id:
            active.parent_id = from_node_id
            active.path_ids = list(dict.fromkeys(parent.path_ids + [from_node_id]))

        if not self._has_children(path, selected_node_id):
            generated = self._generate_next_options(active, path.profile, path.nodes)
            path.nodes.extend(generated)

        path.active_node_id = active.id
        path.breadcrumbs = [self._get_node(path, node_id).title for node_id in self._ordered_path_ids(path)]
        path.summary_ready = active.end_cap or active.depth >= 3 or active.type in {"job", "career", "skill_milestone"}

        prompt = (
            "Would you like to summarize this UofT path now, or continue branching into adjacent skills and campus opportunities?"
            if path.summary_ready
            else "Single-click any nearby bubble to inspect why it fits you, or double-click one to continue building from it."
        )
        return path, prompt

    def node_detail(self, path: PathRecord, node_id: str) -> DetailResponse:
        node = self._get_node(path, node_id)
        unlocks = [child.title for child in path.nodes if child.parent_id == node_id][:4]
        return DetailResponse(
            node=node,
            fit_with_path=self.bedrock.explain_fit(node.model_dump(), path.profile),
            campus_relevance=self.bedrock.campus_relevance(node.model_dump(), path.profile),
            quick_actions=node.quick_actions[:4],
            unlocks_next=unlocks,
        )

    def summarize_path(self, path: PathRecord) -> SummaryResponse:
        ordered = [self._get_node(path, node_id) for node_id in self._ordered_path_ids(path)]
        steps = [
            {
                "title": node.title,
                "type": node.type,
                "summary": node.short_summary,
                "skills_gained": node.skills_gained,
                "why": node.why_it_matters,
            }
            for node in ordered
        ]
        actionables = []
        for node in ordered[1:4]:
            actionables.extend(node.quick_actions[:2])
        actionables.extend(
            [
                "Compare this branch against one alternate UofT path before committing.",
                "Turn the strongest bubble into a real action this week.",
            ]
        )
        return self.bedrock.summarize_path(path.name, steps, list(dict.fromkeys(actionables))[:6], path.profile)

    def _generate_next_options(
        self,
        current: PositionedNode,
        profile: UserProfile,
        existing_nodes: list[PositionedNode],
    ) -> list[PositionedNode]:
        query_terms = self.search.search_related_terms(
            [
                current.title,
                *current.skills_gained,
                *current.tags,
                *profile.interests,
                *profile.desired_careers,
                *profile.desired_opportunities,
                *profile.desired_skills,
                *profile.target_industries,
                *profile.preferred_opportunity_types,
            ]
        )
        candidates = self.search.search_opportunities(
            query_terms,
            filters={"campus": profile.campus, "faculty": profile.program},
            limit=8,
        )
        existing_titles = {node.title for node in existing_nodes}
        payloads: list[NodePayload] = []
        for index, opportunity in enumerate(candidates):
            if opportunity["title"] in existing_titles or opportunity["title"] == current.title:
                continue
            payloads.append(self._opportunity_to_payload(opportunity, current, profile, index))
            if len(payloads) == 5:
                break

        if len(payloads) < 3:
            payloads.extend(self._fallback_payloads(current, profile, existing_titles | {payload.title for payload in payloads}))

        return self._position_nodes(current, payloads[:5], existing_nodes)

    def _opportunity_to_payload(
        self,
        opportunity: dict,
        current: PositionedNode,
        profile: UserProfile,
        index: int,
    ) -> NodePayload:
        confidence = max(0.62, 0.9 - index * 0.06)
        next_step = (
            f"Use this {opportunity['type']} to build toward {', '.join(profile.desired_careers[:1] or profile.target_industries[:1] or ['your next outcome'])}."
        )
        return NodePayload(
            id=f"node-{uuid.uuid4().hex[:8]}",
            title=opportunity["title"],
            type=opportunity["type"],
            short_summary=opportunity["summary"],
            detailed_summary=opportunity["detailed_description"],
            skills_gained=opportunity.get("skills_gained", []),
            why_it_matters=self.bedrock.explain_fit(opportunity, profile),
            logical_next_step=self.bedrock.adapt_branch_label(
                NodePayload(
                    id="temp",
                    title=opportunity["title"],
                    type=opportunity["type"],
                    short_summary=opportunity["summary"],
                    detailed_summary=opportunity["detailed_description"],
                    skills_gained=opportunity.get("skills_gained", []),
                    why_it_matters=opportunity["summary"],
                    logical_next_step=next_step,
                    links=[opportunity.get("source_url", "")] if opportunity.get("source_url") else [],
                    source=opportunity.get("source", "University of Toronto"),
                    source_url=opportunity.get("source_url", ""),
                    campus=opportunity.get("campus", ""),
                    faculty=opportunity.get("faculty", ""),
                    tags=opportunity.get("tags", []),
                    eligibility=opportunity.get("eligibility", ""),
                    related_roles=opportunity.get("related_roles", []),
                    related_skills=opportunity.get("related_skills", []),
                    quick_actions=opportunity.get("quick_actions", []),
                    confidence=confidence,
                    end_cap=opportunity["type"] in {"career", "job", "skill_milestone"},
                ),
                profile,
            ),
            links=[opportunity.get("source_url", "")] if opportunity.get("source_url") else [],
            source=opportunity.get("source", "University of Toronto"),
            source_url=opportunity.get("source_url", ""),
            campus=opportunity.get("campus", ""),
            faculty=opportunity.get("faculty", ""),
            tags=opportunity.get("tags", []),
            eligibility=opportunity.get("eligibility", ""),
            related_roles=opportunity.get("related_roles", []),
            related_skills=opportunity.get("related_skills", []),
            quick_actions=opportunity.get("quick_actions", []),
            confidence=confidence,
            end_cap=opportunity["type"] in {"career", "job", "skill_milestone"} or (current.depth >= 2 and opportunity["type"] in {"opportunity", "experience"}),
        )

    def _fallback_payloads(self, current: PositionedNode, profile: UserProfile, existing_titles: set[str]) -> list[NodePayload]:
        fallback_titles = [
            ("Map a professor or lab shortlist", "professor"),
            ("Find one UofT community to join", "experience"),
            ("Build one skill milestone this month", "skill_milestone"),
        ]
        payloads: list[NodePayload] = []
        for title, node_type in fallback_titles:
            if title in existing_titles:
                continue
            payloads.append(
                NodePayload(
                    id=f"node-{uuid.uuid4().hex[:8]}",
                    title=title,
                    type=node_type,
                    short_summary="A fallback UofT-friendly next step that keeps your exploration moving.",
                    detailed_summary=(
                        f"This branch translates {current.title} into a concrete next move using campus-visible opportunities, clearer self-knowledge, "
                        "and one focused action."
                    ),
                    skills_gained=(profile.desired_skills[:2] or current.skills_gained[:2] or ["career clarity"]),
                    why_it_matters="It prevents the path from stalling and gives you a concrete move you can act on quickly.",
                    logical_next_step="Open the sidebar, review the fit, and decide whether this should become your next committed step.",
                    source="Academic GPS fallback engine",
                    source_url="",
                    campus=profile.campus,
                    faculty=profile.program,
                    tags=profile.interests[:3],
                    eligibility=f"Useful for {profile.year or 'current'} UofT students.",
                    related_roles=profile.desired_careers[:2],
                    related_skills=profile.desired_skills[:3],
                    quick_actions=[
                        "Capture one concrete takeaway.",
                        "Turn it into a 20-minute research task.",
                        "Compare it against one alternate branch.",
                    ],
                    confidence=0.63,
                    end_cap=node_type == "skill_milestone" and current.depth >= 2,
                )
            )
        return payloads

    def _position_nodes(self, parent: PositionedNode, payloads: list[NodePayload], existing_nodes: list[PositionedNode]) -> list[PositionedNode]:
        results: list[PositionedNode] = []
        count = max(len(payloads), 1)
        base_radius = 214 - min(parent.depth * 16, 44)
        grandparent = next((node for node in existing_nodes if node.id == parent.parent_id), None)
        if grandparent:
            base_angle = math.atan2(parent.y - grandparent.y, parent.x - grandparent.x)
        else:
            base_angle = -math.pi / 2
        arc_span = min(math.pi * 1.04, 1.05 + count * 0.34)
        start_angle = base_angle - (arc_span / 2)
        step = arc_span / max(count - 1, 1)
        for index, payload in enumerate(payloads):
            x, y = self._find_open_position(
                parent=parent,
                index=index,
                existing_nodes=existing_nodes + results,
                start_angle=start_angle,
                step=step,
                base_radius=base_radius,
            )
            results.append(
                PositionedNode(
                    **payload.model_dump(),
                    x=round(x, 2),
                    y=round(y, 2),
                    depth=parent.depth + 1,
                    visited=False,
                    active=False,
                    parent_id=parent.id,
                    path_ids=parent.path_ids + [parent.id],
                )
            )
        return results

    def _find_open_position(
        self,
        parent: PositionedNode,
        index: int,
        existing_nodes: list[PositionedNode],
        start_angle: float,
        step: float,
        base_radius: float,
    ) -> tuple[float, float]:
        for ring in range(6):
            radius = base_radius + ring * 34
            angle = start_angle + index * step + (ring % 2) * 0.12
            for nudge in range(10):
                nudged_angle = angle + (nudge - 4.5) * 0.11
                x = parent.x + math.cos(nudged_angle) * radius
                y = parent.y + math.sin(nudged_angle) * radius
                if not self._overlaps(x, y, existing_nodes):
                    return round(x, 2), round(y, 2)
        fallback_angle = start_angle + index * step
        return (
            round(parent.x + math.cos(fallback_angle) * (base_radius + 170), 2),
            round(parent.y + math.sin(fallback_angle) * (base_radius + 170), 2),
        )

    def _overlaps(self, x: float, y: float, nodes: list[PositionedNode]) -> bool:
        candidate_radius = 64
        return any(math.hypot(node.x - x, node.y - y) < (candidate_radius + self._node_radius(node) + 26) for node in nodes)

    def _node_radius(self, node: PositionedNode) -> float:
        if node.active:
            return 108
        if node.visited:
            return 58
        return 64

    def _clear_active(self, path: PathRecord) -> None:
        for node in path.nodes:
            node.active = False

    def _has_children(self, path: PathRecord, node_id: str) -> bool:
        return any(node.parent_id == node_id for node in path.nodes)

    def _get_node(self, path: PathRecord, node_id: str) -> PositionedNode:
        return next(node for node in path.nodes if node.id == node_id)

    def _ordered_path_ids(self, path: PathRecord) -> list[str]:
        current = self._get_node(path, path.active_node_id)
        return list(dict.fromkeys(current.path_ids + [current.id]))

    def _path_name(self, profile: UserProfile) -> str:
        focus = profile.desired_careers[:1] or profile.interests[:1] or ["UofT Path"]
        return f"{focus[0].title()} at UofT"

    def _load_opportunities(self) -> list[dict]:
        s3_seed = self.s3.load_seed_data()
        if isinstance(s3_seed, list) and s3_seed:
            return s3_seed

        docs = [
            *self.uoft_sites.load(),
            *self.linkedin_imports.load(),
            *self.instagram_imports.load(),
            *self.seed.load(),
        ]
        seen: set[str] = set()
        deduped: list[dict] = []
        for item in docs:
            if item["id"] in seen:
                continue
            seen.add(item["id"])
            deduped.append(item)
        return deduped
