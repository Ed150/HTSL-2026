from __future__ import annotations

import os

import boto3

from app.models.schemas import NodePayload, SummaryResponse, UserProfile


class BedrockClient:
    def __init__(self) -> None:
        self.region = os.getenv("us-west-2")
        self.model_id = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
        self.enabled = bool(self.region and os.getenv("ENABLE_BEDROCK") == "true")
        self.client = boto3.client("bedrock-runtime", region_name=self.region) if self.enabled else None

    def build_root_narrative(self, profile: UserProfile) -> dict[str, str]:
        profile_focus = ", ".join(profile.interests[:2] or profile.desired_careers[:1] or ["UofT opportunities"])
        destination = ", ".join(profile.desired_careers[:1] or profile.target_industries[:1] or ["a stronger next step"])
        campus = profile.campus or "University of Toronto"
        program = profile.program or "your program"
        return {
            "title": f"{campus} Path Builder",
            "short_summary": f"A personalized UofT launch point for {profile_focus}.",
            "detailed_summary": (
                f"This node frames your pathway around {campus}, {program}, and your stated goals so each next bubble feels "
                f"locally relevant and closer to {destination}."
            ),
        }

    def adapt_branch_label(self, node: NodePayload, profile: UserProfile) -> str:
        target = ", ".join(
            profile.desired_careers[:1]
            or profile.preferred_opportunity_types[:1]
            or profile.desired_skills[:1]
            or profile.target_industries[:1]
        )
        if not target:
            return node.logical_next_step
        return f"{node.logical_next_step} This keeps momentum toward {target}."

    def explain_fit(self, opportunity: dict, profile: UserProfile) -> str:
        anchors = [profile.program, profile.campus, *profile.interests[:2], *profile.desired_careers[:1]]
        relevant = ", ".join(anchor for anchor in anchors if anchor) or "your current UofT context"
        return (
            f"{opportunity['title']} fits because it is grounded in {opportunity.get('campus', 'UofT')} opportunities and compounds "
            f"{relevant} into a clearer next move."
        )

    def campus_relevance(self, opportunity: dict, profile: UserProfile) -> str:
        campus = opportunity.get("campus") or "University of Toronto"
        faculty = opportunity.get("faculty") or "your broader UofT ecosystem"
        return f"This option is especially relevant to {profile.campus or 'UofT'} students navigating {faculty} opportunities around {campus}."

    def summarize_path(self, title: str, steps: list[dict], actionables: list[str], profile: UserProfile) -> SummaryResponse:
        overview = (
            f"{title} turns your UofT profile into a believable arc by moving from interests and campus context into "
            f"opportunities, relationships, and increasingly concrete outcomes."
        )
        recommendation = (
            f"Keep branching if you want adjacent UofT opportunities, or stop here and turn the strongest branch into a concrete move "
            f"for your {profile.year or 'current'} year."
        )
        return SummaryResponse(
            title=title,
            overview=overview,
            steps=steps,
            actionables=actionables,
            recommendation=recommendation,
        )
