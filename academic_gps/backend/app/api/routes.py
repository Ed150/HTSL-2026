from fastapi import APIRouter, HTTPException

from app.core.graph_builder import GraphBuilder
from app.core.models import (
    CalendarCreateRequest,
    CalendarPlanRequest,
    CalendarPlanResponse,
    DiscoverRequest,
    DiscoverResponse,
    MapResponse,
)
from app.core.recommendation_engine import RecommendationEngine
from app.core.scheduler import Scheduler
from app.services.google_calendar_client import GoogleCalendarClient


router = APIRouter()
engine = RecommendationEngine()
graph_builder = GraphBuilder()
scheduler = Scheduler()
calendar_client = GoogleCalendarClient()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "mode": engine.mode}


@router.get("/demo")
def demo() -> DiscoverResponse:
    request = DiscoverRequest(
        interests="I am interested in quantum computing and photonics.",
        skills=["Python", "linear algebra", "physics"],
        goals="research career in advanced hardware",
        program="Engineering Science",
        year="3",
        industries=["quantum", "photonics"],
        availability_preferences="weekday evenings and Friday afternoons",
    )
    return engine.discover(request)


@router.post("/discover", response_model=DiscoverResponse)
def discover(request: DiscoverRequest) -> DiscoverResponse:
    return engine.discover(request)


@router.post("/map", response_model=MapResponse)
def map_pathway(request: DiscoverRequest) -> MapResponse:
    result = engine.discover(request)
    return graph_builder.build_map(result)


@router.post("/planner/suggest", response_model=CalendarPlanResponse)
def suggest_plan(request: CalendarPlanRequest) -> CalendarPlanResponse:
    result = engine.discover(request.discovery)
    busy_windows = calendar_client.get_busy_windows(
        access_token=request.access_token,
        days=request.days,
        demo_calendar=request.demo_calendar,
    )
    return scheduler.create_plan(
        actions=result.suggested_calendar_actions,
        busy_windows=busy_windows,
        days=request.days,
    )


@router.post("/planner/create-event")
def create_event(request: CalendarCreateRequest) -> dict:
    if not request.confirmed:
        raise HTTPException(status_code=400, detail="Event creation requires confirmation.")
    created = calendar_client.create_event(
        access_token=request.access_token,
        event=request.event,
    )
    return created


@router.get("/auth/google/status")
def google_status() -> dict[str, bool]:
    return {"configured": calendar_client.is_configured()}
