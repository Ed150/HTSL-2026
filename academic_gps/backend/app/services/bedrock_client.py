from __future__ import annotations

import os

import boto3

from app.core.models import DiscoverRequest, Recommendation
from app.core.ranking import tokenize


class BedrockClient:
    def __init__(self) -> None:
        self.region = os.getenv("AWS_REGION")
        self.model_id = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
        self.enabled = bool(self.region and os.getenv("ENABLE_BEDROCK") == "true")
        self.client = boto3.client("bedrock-runtime", region_name=self.region) if self.enabled else None

    def parse_interest(self, request: DiscoverRequest) -> dict:
        terms = tokenize(" ".join([request.interests, request.goals, " ".join(request.skills), " ".join(request.industries)]))
        unique_terms = []
        for term in terms:
            if term not in unique_terms:
                unique_terms.append(term)
        return {
            "interest_summary": request.interests,
            "goal_summary": request.goals,
            "query_terms": unique_terms[:12],
            "skills": request.skills,
            "industries": request.industries,
            "mode": "bedrock" if self.enabled else "mocked-intent-parser",
        }

    def explain_match(self, item: dict, query_terms: list[str]) -> str:
        matched = [term for term in query_terms if term in " ".join(item.get("tags", []) + item.get("research_areas", [])).lower()]
        if matched:
            return f"Strong thematic overlap around {', '.join(matched[:3])}, with adjacent fit through {item.get('description', '').lower()}."
        return f"Relevant because it connects your interests to adjacent opportunities in {item.get('description', '').lower()}."

    def generate_summary(
        self,
        request: DiscoverRequest,
        professors: list[Recommendation],
        labs: list[Recommendation],
        alumni: list[Recommendation],
        courses: list[Recommendation],
        events: list[Recommendation],
    ) -> str:
        return (
            f"Academic GPS found a high-fit pathway for {request.interests.lower()} that starts with "
            f"{labs[0].name if labs else 'research groups'}, builds through {professors[0].name if professors else 'faculty'}, "
            f"and opens toward outcomes like {alumni[0].name if alumni else 'aligned alumni'}. "
            f"Courses such as {courses[0].name if courses else 'targeted coursework'} and events like "
            f"{events[0].name if events else 'timely seminars'} create immediate next steps."
        )
