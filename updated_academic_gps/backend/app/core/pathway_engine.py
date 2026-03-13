from __future__ import annotations

import json
import math
import uuid
from pathlib import Path

from app.models.schemas import (
    DetailResponse,
    EdgePayload,
    NodePayload,
    PathRecord,
    PositionedNode,
    SummaryResponse,
    UserProfile,
)
from app.services.bedrock_client import BedrockClient
from app.services.opensearch_client import OpenSearchClient
from app.services.s3_client import S3Client


class PathwayEngine:
    def __init__(self) -> None:
        self.bedrock = BedrockClient()
        self.search = OpenSearchClient()
        self.s3 = S3Client()
        self.seed = self._load_seed()

    def initialize_path(self, profile: UserProfile) -> PathRecord:
        theme = self.bedrock.choose_theme(profile)
        template = next(item for item in self.seed["templates"] if item["theme"] == theme)
        root = PositionedNode(
            id=f"node-{uuid.uuid4().hex[:8]}",
            title=template["start_title"],
            type=template["start_type"],
            short_summary=template["start_short"],
            detailed_summary=template["start_detail"],
            skills_gained=profile.skills[:3],
            why_it_matters="This anchor node reflects your current starting point and sets the tone for branching choices.",
            logical_next_step="Choose the branch that feels most energizing right now.",
            confidence=0.96,
            x=0,
            y=0,
            depth=0,
            visited=True,
            active=True,
            path_ids=[],
            end_cap=False,
        )
        branch_nodes = self._make_children(template["branches"], root, profile, existing_nodes=[])
        nodes = [root, *branch_nodes]
        return PathRecord(
            id=f"path-{uuid.uuid4().hex[:8]}",
            name=self._path_name(profile, root.title),
            profile=profile,
            nodes=nodes,
            edges=[],
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

        if from_node_id != selected_node_id and not any(edge.source == from_node_id and edge.target == selected_node_id for edge in path.edges):
            path.edges.append(
                EdgePayload(
                    id=f"edge-{uuid.uuid4().hex[:8]}",
                    source=from_node_id,
                    target=selected_node_id,
                    label="opens_path_to",
                    branch_index=len([edge for edge in path.edges if edge.source == from_node_id]),
                )
            )

        if not self._has_children(path, selected_node_id):
            generated = self._generate_next_options(active, path.profile, path.nodes)
            path.nodes.extend(generated)

        if active.title not in path.breadcrumbs:
            path.breadcrumbs.append(active.title)
        path.active_node_id = active.id
        path.summary_ready = active.end_cap or active.depth >= 3 or active.type in {"job", "career", "skill_milestone"}

        prompt = (
            "Would you like to end and summarize this path, or continue branching to build adjacent skills and opportunities?"
            if path.summary_ready
            else "Choose another nearby branch or zoom out to compare the shape of your path."
        )
        return path, prompt

    def node_detail(self, path: PathRecord, node_id: str) -> DetailResponse:
        node = self._get_node(path, node_id)
        fit = f"{node.title} fits this path because it compounds toward {path.breadcrumbs[-1]} while adding {', '.join(node.skills_gained[:2]) or 'useful capabilities'}."
        unlocks = [child.title for child in path.nodes if child.parent_id == node_id][:4]
        return DetailResponse(node=node, fit_with_path=fit, unlocks_next=unlocks)

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
        actionables = [
            f"Explore {node.title.lower()} more deeply." for node in ordered[1:4]
        ] + [
            "Choose one branch to turn into a real-world commitment this week.",
            "Revisit an earlier node and create an alternate branch for comparison.",
        ]
        return self.bedrock.summarize_path(path.name, steps, actionables[:6])

    def _generate_next_options(self, current: PositionedNode, profile: UserProfile, existing_nodes: list[PositionedNode]) -> list[PositionedNode]:
        terms = self.search.search_related_terms(profile.desired_skills + profile.desired_opportunities + profile.desired_careers + current.skills_gained)
        derived = [
            NodePayload(
                id=f"node-{uuid.uuid4().hex[:8]}",
                title=f"Deepen {term.title()} Through Practice",
                type="skill_milestone" if index == 0 else ("opportunity" if index % 2 else "project"),
                short_summary=f"A focused branch that compounds {term} into something visible.",
                detailed_summary=f"This branch turns {term} into a concrete milestone through practice, conversation, or applied work connected to {current.title}.",
                skills_gained=[term, *current.skills_gained[:2]],
                why_it_matters=f"It keeps the path coherent while expanding what {current.title} can unlock.",
                logical_next_step=f"From here you can strengthen {term} and reveal adjacent opportunities.",
                confidence=max(0.58, 0.82 - index * 0.05),
                end_cap=index == 0 and current.depth >= 2,
            )
            for index, term in enumerate((terms or ["portfolio", "research fit", "networking", "technical depth"])[:4])
        ]
        return self._position_nodes(current, derived, profile, existing_nodes)

    def _make_children(self, branches: list[dict], parent: PositionedNode, profile: UserProfile, existing_nodes: list[PositionedNode]) -> list[PositionedNode]:
        payloads = [
            NodePayload(
                id=f"node-{uuid.uuid4().hex[:8]}",
                title=item["title"],
                type=item["type"],
                short_summary=item["summary"],
                detailed_summary=item["detail"],
                skills_gained=item["skills"],
                why_it_matters=item["why"],
                logical_next_step=self.bedrock.adapt_branch_label(
                    NodePayload(
                        id="temp",
                        title=item["title"],
                        type=item["type"],
                        short_summary=item["summary"],
                        detailed_summary=item["detail"],
                        skills_gained=item["skills"],
                        why_it_matters=item["why"],
                        logical_next_step=item["next"],
                        confidence=0.8,
                    ),
                    profile,
                ),
                confidence=0.84,
                end_cap=item["type"] in {"job", "career"},
            )
            for item in branches[:5]
        ]
        return self._position_nodes(parent, payloads, profile, existing_nodes)

    def _position_nodes(
        self,
        parent: PositionedNode,
        payloads: list[NodePayload],
        profile: UserProfile,
        existing_nodes: list[PositionedNode],
    ) -> list[PositionedNode]:
        del profile
        results: list[PositionedNode] = []
        count = max(len(payloads), 1)
        base_radius = 206 - min(parent.depth * 14, 40)
        grandparent = next((node for node in existing_nodes if node.id == parent.parent_id), None)
        if grandparent:
            base_angle = math.atan2(parent.y - grandparent.y, parent.x - grandparent.x)
        else:
            base_angle = -math.pi / 2
        arc_span = min(math.pi * 0.92, 0.9 + count * 0.34)
        start_angle = base_angle - (arc_span / 2)
        step = arc_span / max(count - 1, 1)
        for index, payload in enumerate(payloads):
            x, y = self._find_open_position(
                parent=parent,
                index=index,
                count=count,
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
        count: int,
        existing_nodes: list[PositionedNode],
        start_angle: float,
        step: float,
        base_radius: float,
    ) -> tuple[float, float]:
        for ring in range(6):
            radius = base_radius + ring * 34
            spread_offset = (ring % 2) * 0.1
            angle = start_angle + index * step + spread_offset
            for nudge in range(8):
                nudged_angle = angle + (nudge - 3.5) * 0.12
                x = parent.x + math.cos(nudged_angle) * radius
                y = parent.y + math.sin(nudged_angle) * radius
                if not self._overlaps(x, y, existing_nodes):
                    return round(x, 2), round(y, 2)
        fallback_angle = start_angle + index * step
        return (
            round(parent.x + math.cos(fallback_angle) * (base_radius + 160), 2),
            round(parent.y + math.sin(fallback_angle) * (base_radius + 160), 2),
        )

    def _overlaps(self, x: float, y: float, nodes: list[PositionedNode]) -> bool:
        candidate_radius = 76
        return any(math.hypot(node.x - x, node.y - y) < (candidate_radius + self._node_radius(node) + 24) for node in nodes)

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
        order = current.path_ids + [current.id]
        return list(dict.fromkeys(order))

    def _path_name(self, profile: UserProfile, root_title: str) -> str:
        focus = profile.desired_careers[:1] or profile.interests[:1] or [root_title]
        return f"{focus[0].title()} Path"

    def _load_seed(self) -> dict:
        s3_seed = self.s3.load_seed_data()
        if s3_seed:
            return s3_seed
        path = Path(__file__).resolve().parents[1] / "data" / "seed_nodes.json"
        return json.loads(path.read_text(encoding="utf-8"))
