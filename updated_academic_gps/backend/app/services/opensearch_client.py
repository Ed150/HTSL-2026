from __future__ import annotations

import os


class OpenSearchClient:
    def __init__(self) -> None:
        self.endpoint = os.getenv("OPENSEARCH_ENDPOINT")
        self.index_name = os.getenv("OPENSEARCH_INDEX", "academic-gps-branches")
        self.enabled = bool(self.endpoint and os.getenv("ENABLE_OPENSEARCH") == "true")

    def search_related_terms(self, terms: list[str]) -> list[str]:
        if not terms:
            return []
        return list(dict.fromkeys(terms))[:6]
