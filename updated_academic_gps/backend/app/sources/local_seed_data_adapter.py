from __future__ import annotations

import json
from pathlib import Path


class LocalSeedDataAdapter:
    def __init__(self, filename: str = "uoft_opportunities.json") -> None:
        self.filename = filename

    def load(self) -> list[dict]:
        path = Path(__file__).resolve().parents[1] / "data" / self.filename
        return json.loads(path.read_text(encoding="utf-8"))
