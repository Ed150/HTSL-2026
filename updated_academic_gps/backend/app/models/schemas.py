from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


NodeType = Literal[
    "interest",
    "skill",
    "opportunity",
    "experience",
    "course",
    "professor",
    "lab",
    "project",
    "career",
    "job",
    "skill_milestone",
]


class UserProfile(BaseModel):
    skills: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    desired_careers: list[str] = Field(default_factory=list)
    desired_opportunities: list[str] = Field(default_factory=list)
    desired_skills: list[str] = Field(default_factory=list)


class NodePayload(BaseModel):
    id: str
    title: str
    type: NodeType
    short_summary: str
    detailed_summary: str
    skills_gained: list[str] = Field(default_factory=list)
    why_it_matters: str
    logical_next_step: str
    links: list[str] = Field(default_factory=list)
    confidence: float = 0.72
    end_cap: bool = False


class PositionedNode(NodePayload):
    x: float
    y: float
    depth: int = 0
    visited: bool = False
    active: bool = False
    parent_id: str | None = None
    path_ids: list[str] = Field(default_factory=list)


class EdgePayload(BaseModel):
    id: str
    source: str
    target: str
    label: str
    branch_index: int = 0


class PathRecord(BaseModel):
    id: str
    name: str
    profile: UserProfile
    nodes: list[PositionedNode]
    edges: list[EdgePayload]
    active_node_id: str
    breadcrumbs: list[str]
    summary_ready: bool = False


class InitializePathRequest(BaseModel):
    profile: UserProfile


class InitializePathResponse(BaseModel):
    path: PathRecord


class ExpandNodeRequest(BaseModel):
    path: PathRecord
    from_node_id: str
    selected_node_id: str


class ExpandNodeResponse(BaseModel):
    path: PathRecord
    prompt: str


class SummaryRequest(BaseModel):
    path: PathRecord


class SummaryResponse(BaseModel):
    title: str
    overview: str
    steps: list[dict]
    actionables: list[str]
    recommendation: str


class DetailResponse(BaseModel):
    node: NodePayload
    fit_with_path: str
    unlocks_next: list[str]
