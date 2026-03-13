from __future__ import annotations

import os


class OpenSearchClient:
    def __init__(self) -> None:
        self.endpoint = os.getenv("OPENSEARCH_ENDPOINT")
        self.index_name = os.getenv("OPENSEARCH_INDEX", "academic-gps")
        self.enabled = bool(self.endpoint and os.getenv("ENABLE_OPENSEARCH") == "true")

    def search(self, query: str) -> list[dict]:
        return []
