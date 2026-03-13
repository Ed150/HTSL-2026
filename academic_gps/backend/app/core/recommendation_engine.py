from __future__ import annotations

import json
from pathlib import Path

from app.core.models import ActionItem, DiscoverRequest, DiscoverResponse, Recommendation
from app.core.pathway_engine import PathwayEngine
from app.core.ranking import keyword_score, normalize_scores, overlap_score, tokenize
from app.services.bedrock_client import BedrockClient
from app.services.opensearch_client import OpenSearchClient
from app.services.s3_client import S3Client


class RecommendationEngine:
    def __init__(self) -> None:
        self.bedrock = BedrockClient()
        self.search = OpenSearchClient()
        self.s3 = S3Client()
        self.pathway_engine = PathwayEngine()
        self.dataset = self._load_dataset()
        self.mode = "aws" if self.bedrock.enabled or self.search.enabled else "demo"

    def discover(self, request: DiscoverRequest) -> DiscoverResponse:
        parsed_intent = self.bedrock.parse_interest(request)
        query_terms = parsed_intent["query_terms"]
        goal_terms = tokenize(request.goals)
        skill_terms = tokenize(" ".join(request.skills))
        industry_terms = tokenize(" ".join(request.industries))

        professors = self._rank_entities("professors", query_terms, goal_terms, skill_terms, industry_terms)
        labs = self._rank_entities("labs", query_terms, goal_terms, skill_terms, industry_terms)
        alumni = self._rank_entities("alumni", query_terms, goal_terms, skill_terms, industry_terms)
        courses = self._rank_entities("courses", query_terms, goal_terms, skill_terms, industry_terms)
        events = self._rank_entities("events", query_terms, goal_terms, skill_terms, industry_terms)
        opportunities = self._rank_entities("opportunities", query_terms, goal_terms, skill_terms, industry_terms)

        actions = self._build_actions(
            query_terms=query_terms,
            top_entities=(professors[:2] + labs[:2] + events[:2] + courses[:2] + alumni[:2]),
        )
        pathway = self.pathway_engine.build(
            interests=request.interests,
            goals=request.goals,
            professors=professors,
            labs=labs,
            courses=courses,
            events=events,
            alumni=alumni,
        )

        summary = self.bedrock.generate_summary(
            request=request,
            professors=professors[:3],
            labs=labs[:3],
            alumni=alumni[:3],
            courses=courses[:3],
            events=events[:3],
        )

        weekly_plan_preview = [
            f"Monday: {actions[0].title}" if len(actions) > 0 else "Monday: Review a matching lab",
            f"Wednesday: {actions[1].title}" if len(actions) > 1 else "Wednesday: Explore a professor profile",
            f"Friday: {actions[2].title}" if len(actions) > 2 else "Friday: Attend one relevant event",
        ]

        return DiscoverResponse(
            parsed_intent=parsed_intent,
            summary=summary,
            professors=professors[:5],
            labs=labs[:5],
            alumni=alumni[:5],
            courses=courses[:5],
            events=events[:5],
            opportunities=opportunities[:5],
            suggested_next_steps=actions[:6],
            suggested_calendar_actions=actions[:8],
            pathway=pathway,
            weekly_plan_preview=weekly_plan_preview,
        )

    def _load_dataset(self) -> dict:
        s3_dataset = self.s3.try_load_seed_dataset()
        if s3_dataset:
            return s3_dataset
        data_path = Path(__file__).resolve().parents[1] / "data" / "seed_data.json"
        return json.loads(data_path.read_text(encoding="utf-8"))

    def _rank_entities(
        self,
        section: str,
        query_terms: list[str],
        goal_terms: list[str],
        skill_terms: list[str],
        industry_terms: list[str],
    ) -> list[Recommendation]:
        records = []
        for item in self.dataset[section]:
            text = " ".join(
                [
                    item.get("name", ""),
                    item.get("description", ""),
                    " ".join(item.get("research_areas", [])),
                    " ".join(item.get("industries", [])),
                    " ".join(item.get("skills", [])),
                ]
            )
            score = keyword_score(query_terms, text, item.get("tags", []))
            score += overlap_score(goal_terms, item.get("industries", []) + item.get("career_paths", [])) * 1.5
            score += overlap_score(skill_terms, item.get("skills", [])) * 1.2
            score += overlap_score(industry_terms, item.get("industries", [])) * 1.3
            score += item.get("priority_boost", 0)

            explanation = self.bedrock.explain_match(item=item, query_terms=query_terms)
            records.append(
                {
                    "id": item["id"],
                    "name": item["name"],
                    "type": item["type"],
                    "short_description": item["description"],
                    "tags": item.get("tags", []),
                    "score": score,
                    "explanation": explanation,
                    "metadata": {
                        "research_areas": item.get("research_areas", []),
                        "industries": item.get("industries", []),
                        "links": item.get("links", []),
                    },
                }
            )

        normalize_scores(records)
        records.sort(key=lambda record: record["score"], reverse=True)
        return [
            Recommendation(
                id=record["id"],
                name=record["name"],
                type=record["type"],
                short_description=record["short_description"],
                tags=record["tags"],
                relevance_score=record["score"],
                explanation=record["explanation"],
                metadata=record["metadata"],
            )
            for record in records
        ]

    def _build_actions(self, query_terms: list[str], top_entities: list[Recommendation]) -> list[ActionItem]:
        templates = self.dataset["action_templates"]
        actions: list[ActionItem] = []
        for index, entity in enumerate(top_entities):
            template = templates[index % len(templates)]
            title = template["title_template"].format(name=entity.name)
            why = f"{template['why']} This directly supports your interest in {' / '.join(query_terms[:3])}."
            actions.append(
                ActionItem(
                    id=f"action-{index + 1}",
                    title=title,
                    type=template["type"],
                    estimated_minutes=template["estimated_minutes"],
                    priority=template["priority"],
                    why_it_matters=why,
                    suggested_schedule_window=template["suggested_schedule_window"],
                    urgency=template["urgency"],
                    value_score=round(min(1.0, entity.relevance_score * 0.7 + template["value_score"] * 0.3), 3),
                    deadline_window=template["deadline_window"],
                    related_entity_ids=[entity.id],
                )
            )
        return actions
