from fastapi import APIRouter

from app.core.pathway_engine import PathwayEngine
from app.models.schemas import (
    DetailResponse,
    ExpandNodeRequest,
    ExpandNodeResponse,
    InitializePathRequest,
    InitializePathResponse,
    SummaryRequest,
    SummaryResponse,
)


router = APIRouter()
engine = PathwayEngine()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "experience": "branching-map"}


@router.post("/paths/init", response_model=InitializePathResponse)
def init_path(request: InitializePathRequest) -> InitializePathResponse:
    return InitializePathResponse(path=engine.initialize_path(request.profile))


@router.post("/paths/expand", response_model=ExpandNodeResponse)
def expand_path(request: ExpandNodeRequest) -> ExpandNodeResponse:
    path, prompt = engine.expand_path(request.path, request.from_node_id, request.selected_node_id)
    return ExpandNodeResponse(path=path, prompt=prompt)


@router.post("/paths/summary", response_model=SummaryResponse)
def summarize_path(request: SummaryRequest) -> SummaryResponse:
    return engine.summarize_path(request.path)


@router.post("/paths/node-detail", response_model=DetailResponse)
def node_detail(request: ExpandNodeRequest) -> DetailResponse:
    return engine.node_detail(request.path, request.selected_node_id)
