from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router


app = FastAPI(
    title="Academic GPS API",
    version="0.1.0",
    description="AI-assisted academic and career discovery platform with pathway planning.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": "Academic GPS",
        "status": "ok",
        "docs": "/docs",
        "demo_query": "quantum computing and photonics",
    }
