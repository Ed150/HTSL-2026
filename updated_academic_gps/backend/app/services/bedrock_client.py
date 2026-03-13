from __future__ import annotations

import os

import boto3

from app.models.schemas import NodePayload, SummaryResponse, UserProfile


class BedrockClient:
    def __init__(self) -> None:
        self.region = os.getenv("AWS_REGION")
        self.model_id = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
        self.enabled = bool(self.region and os.getenv("ENABLE_BEDROCK") == "true")
        self.client = boto3.client("bedrock-runtime", region_name=self.region) if self.enabled else None

    def choose_theme(self, profile: UserProfile) -> str:
        combined = " ".join(profile.skills + profile.interests + profile.desired_careers + profile.desired_opportunities + profile.desired_skills).lower()
        if any(term in combined for term in ["quantum", "photonics", "optics"]):
            return "quantum"
        if any(term in combined for term in ["robot", "autonomy", "robotics", "embodied"]):
            return "robotics"
        return "ai"

    def adapt_branch_label(self, node: NodePayload, profile: UserProfile) -> str:
        target = ", ".join(profile.desired_careers[:1] or profile.desired_opportunities[:1] or profile.desired_skills[:1])
        if not target:
            return node.logical_next_step
        return f"{node.logical_next_step} This keeps momentum toward {target}."

    def summarize_path(self, title: str, steps: list[dict], actionables: list[str]) -> SummaryResponse:
        overview = (
            f"{title} turns exploration into a believable academic arc by moving from curiosity into evidence, "
            f"relationships, and increasingly concrete outcomes."
        )
        recommendation = "Continue branching if you want adjacent skills, or stop here and turn the strongest branch into a real next move."
        return SummaryResponse(
            title=title,
            overview=overview,
            steps=steps,
            actionables=actionables,
            recommendation=recommendation,
        )
