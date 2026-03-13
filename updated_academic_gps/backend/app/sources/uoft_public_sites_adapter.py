from __future__ import annotations

from app.sources.local_seed_data_adapter import LocalSeedDataAdapter


class UofTPublicSitesAdapter:
    def __init__(self) -> None:
        self.seed = LocalSeedDataAdapter()

    def load(self) -> list[dict]:
        items = self.seed.load()
        return [item for item in items if item.get("source", "").startswith("University of Toronto")]
