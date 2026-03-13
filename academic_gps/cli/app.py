from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = ROOT / "academic_gps" / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.graph_builder import GraphBuilder
from app.core.models import DiscoverRequest
from app.core.recommendation_engine import RecommendationEngine
from app.core.scheduler import Scheduler
from app.services.google_calendar_client import GoogleCalendarClient


def _print_json(payload: dict | list) -> None:
    print(json.dumps(payload, indent=2, default=str))


def ingest_data() -> None:
    engine = RecommendationEngine()
    print("Seed data loaded successfully.")
    print(f"Professors: {len(engine.dataset['professors'])}")
    print(f"Labs / groups: {len(engine.dataset['labs'])}")
    print(f"Alumni: {len(engine.dataset['alumni'])}")
    print(f"Courses: {len(engine.dataset['courses'])}")
    print(f"Events: {len(engine.dataset['events'])}")
    print(f"Opportunities: {len(engine.dataset['opportunities'])}")


def discover(interest: str, goal: str = "", skills: list[str] | None = None) -> None:
    engine = RecommendationEngine()
    response = engine.discover(
        DiscoverRequest(
            interests=interest,
            goals=goal,
            skills=skills or [],
        )
    )
    _print_json(response.model_dump())


def make_map(interest: str, goal: str = "") -> None:
    engine = RecommendationEngine()
    builder = GraphBuilder()
    response = engine.discover(DiscoverRequest(interests=interest, goals=goal))
    map_response = builder.build_map(response)
    _print_json(map_response.model_dump())


def explain(interest: str, goal: str = "") -> None:
    engine = RecommendationEngine()
    response = engine.discover(DiscoverRequest(interests=interest, goals=goal))
    print(response.summary)
    print()
    print(response.pathway.narration)


def plan(interest: str, goal: str = "", calendar_summary: str | None = None) -> None:
    engine = RecommendationEngine()
    scheduler = Scheduler()
    calendar = GoogleCalendarClient()
    response = engine.discover(DiscoverRequest(interests=interest, goals=goal))
    demo_calendar = None
    if calendar_summary:
        demo_calendar = json.loads(Path(calendar_summary).read_text(encoding="utf-8"))["busy_windows"]
    busy = calendar.get_busy_windows(access_token=None, demo_calendar=demo_calendar)
    plan_response = scheduler.create_plan(response.suggested_calendar_actions, busy)
    _print_json(plan_response.model_dump())


def demo() -> None:
    sample_calendar = ROOT / "academic_gps" / "backend" / "app" / "data" / "sample_calendar.json"
    print("Academic GPS demo mode")
    discover("quantum computing and photonics", "research career", ["Python", "physics"])
    print()
    print("Planner preview")
    plan("quantum computing and photonics", "research career", str(sample_calendar))


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Academic GPS CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("ingest-data")

    discover_parser = subparsers.add_parser("discover")
    discover_parser.add_argument("--interest", required=True)
    discover_parser.add_argument("--goal", default="")
    discover_parser.add_argument("--skills", nargs="*", default=[])

    map_parser = subparsers.add_parser("map")
    map_parser.add_argument("--interest", required=True)
    map_parser.add_argument("--goal", default="")

    explain_parser = subparsers.add_parser("explain")
    explain_parser.add_argument("--interest", required=True)
    explain_parser.add_argument("--goal", default="")

    plan_parser = subparsers.add_parser("plan")
    plan_parser.add_argument("--interest", required=True)
    plan_parser.add_argument("--goal", default="")
    plan_parser.add_argument("--calendar-summary", default="")

    subparsers.add_parser("demo")

    args = parser.parse_args()
    if args.command == "ingest-data":
        ingest_data()
    elif args.command == "discover":
        discover(args.interest, args.goal, args.skills)
    elif args.command == "map":
        make_map(args.interest, args.goal)
    elif args.command == "explain":
        explain(args.interest, args.goal)
    elif args.command == "plan":
        plan(args.interest, args.goal, args.calendar_summary or None)
    elif args.command == "demo":
        demo()
