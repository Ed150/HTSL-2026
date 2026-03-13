from __future__ import annotations

from app.core.models import Pathway, PathwayStage, Recommendation


class PathwayEngine:
    def build(
        self,
        interests: str,
        goals: str,
        professors: list[Recommendation],
        labs: list[Recommendation],
        courses: list[Recommendation],
        events: list[Recommendation],
        alumni: list[Recommendation],
    ) -> Pathway:
        top_lab = labs[0] if labs else None
        top_prof = professors[0] if professors else None
        top_course = courses[0] if courses else None
        top_event = events[0] if events else None
        top_alumni = alumni[0] if alumni else None

        stages = [
            PathwayStage(
                title="Interests",
                summary=interests,
                related_ids=["interest-anchor"],
            ),
            PathwayStage(
                title="Research Direction",
                summary=f"Translate your interests toward {top_lab.name if top_lab else 'high-fit labs'} and adjacent research areas.",
                related_ids=[top_lab.id] if top_lab else [],
            ),
            PathwayStage(
                title="People To Know",
                summary=f"Start with {top_prof.name if top_prof else 'relevant faculty'} and alumni who bridge academia to outcomes.",
                related_ids=[item.id for item in [top_prof, top_alumni] if item],
            ),
            PathwayStage(
                title="Opportunities To Enter",
                summary=f"Use {top_course.name if top_course else 'courses'} and {top_event.name if top_event else 'events'} as low-friction entry points.",
                related_ids=[item.id for item in [top_course, top_event] if item],
            ),
            PathwayStage(
                title="Career Outcomes",
                summary=f"Build toward {top_alumni.name if top_alumni else 'aligned alumni pathways'} and goal themes like {goals or 'research and industry options'}.",
                related_ids=[top_alumni.id] if top_alumni else [],
            ),
        ]

        immediate = [
            f"Review {top_prof.name}'s recent work." if top_prof else "Review 2 faculty profiles.",
            f"Scan {top_lab.name} for projects and openings." if top_lab else "Scan top matching lab pages.",
            f"Add {top_event.name} to your plan." if top_event else "Add one event to this week's plan.",
        ]
        short_term = [
            f"Take or audit {top_course.name}." if top_course else "Identify one course to deepen fit.",
            "Draft one outreach email informed by a lab's current agenda.",
            "Track application or seminar deadlines tied to your interests.",
        ]
        medium = [
            "Turn recurring exploration into weekly momentum with calendar blocks.",
            "Build proof of interest through research notes, portfolio pieces, or seminar participation.",
            "Convert academic exploration into alumni conversations and internship leads.",
        ]

        headline = f"From {interests.split('.')[0]} to concrete academic and career momentum"
        narration = (
            "Academic GPS maps your interest signal into a path that starts with discovery, "
            "moves through labs and courses, and ends in visible career outcomes."
        )

        return Pathway(
            headline=headline,
            narration=narration,
            immediate_next_steps=immediate,
            short_term_actions=short_term,
            medium_term_path=medium,
            stages=stages,
        )
