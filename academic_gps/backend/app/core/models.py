from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


RecommendationType = Literal[
    "professor",
    "lab",
    "research_group",
    "alumni",
    "course",
    "event",
    "opportunity",
    "industry",
]

NodeType = Literal[
    "interest",
    "research_area",
    "professor",
    "lab",
    "research_group",
    "course",
    "event",
    "opportunity",
    "alumni",
    "industry",
    "action",
]


class DiscoverRequest(BaseModel):
    interests: str
    skills: list[str] = Field(default_factory=list)
    goals: str = ""
    program: str = ""
    year: str = ""
    industries: list[str] = Field(default_factory=list)
    availability_preferences: str = ""


class Recommendation(BaseModel):
    id: str
    name: str
    type: RecommendationType
    short_description: str
    tags: list[str] = Field(default_factory=list)
    relevance_score: float
    explanation: str
    metadata: dict = Field(default_factory=dict)


class ActionItem(BaseModel):
    id: str
    title: str
    type: str
    estimated_minutes: int
    priority: str
    why_it_matters: str
    suggested_schedule_window: str
    urgency: int
    value_score: float
    deadline_window: str
    related_entity_ids: list[str] = Field(default_factory=list)


class PathwayStage(BaseModel):
    title: str
    summary: str
    related_ids: list[str] = Field(default_factory=list)


class Pathway(BaseModel):
    headline: str
    narration: str
    immediate_next_steps: list[str]
    short_term_actions: list[str]
    medium_term_path: list[str]
    stages: list[PathwayStage]


class WeeklyPlanItem(BaseModel):
    action_id: str
    title: str
    start: datetime
    end: datetime
    rationale: str


class CalendarSlot(BaseModel):
    start: datetime
    end: datetime
    score: float
    note: str


class CalendarPlanResponse(BaseModel):
    scheduled_actions: list[WeeklyPlanItem]
    unscheduled_actions: list[ActionItem]
    free_slots: list[CalendarSlot]
    summary: str


class DiscoverResponse(BaseModel):
    parsed_intent: dict
    summary: str
    professors: list[Recommendation]
    labs: list[Recommendation]
    alumni: list[Recommendation]
    courses: list[Recommendation]
    events: list[Recommendation]
    opportunities: list[Recommendation]
    suggested_next_steps: list[ActionItem]
    suggested_calendar_actions: list[ActionItem]
    pathway: Pathway
    weekly_plan_preview: list[str]


class GraphNode(BaseModel):
    id: str
    label: str
    type: NodeType
    size: int = 18
    color: str
    detail: str
    highlighted: bool = False


class GraphEdge(BaseModel):
    source: str
    target: str
    label: str
    weight: float = 1.0
    highlighted: bool = False


class MapResponse(BaseModel):
    title: str
    subtitle: str
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    highlighted_path: list[str]
    export_path: str


class CalendarBusyWindow(BaseModel):
    start: datetime
    end: datetime
    title: str = "Busy"


class CalendarPlanRequest(BaseModel):
    discovery: DiscoverRequest
    access_token: str | None = None
    demo_calendar: list[dict] | None = None
    days: int = 14


class CalendarEventPayload(BaseModel):
    title: str
    description: str = ""
    start: datetime
    end: datetime


class CalendarCreateRequest(BaseModel):
    access_token: str | None = None
    event: CalendarEventPayload
    confirmed: bool = False
