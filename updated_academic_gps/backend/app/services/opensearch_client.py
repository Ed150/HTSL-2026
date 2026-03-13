from __future__ import annotations

import os
from collections.abc import Iterable


class OpenSearchClient:
    def __init__(self) -> None:
        self.endpoint = os.getenv("OPENSEARCH_ENDPOINT")
        self.index_name = os.getenv("OPENSEARCH_INDEX", "uoft-academic-gps-opportunities")
        self.enabled = bool(self.endpoint and os.getenv("ENABLE_OPENSEARCH") == "true")
        self._documents: list[dict] = []

    def index_documents(self, documents: Iterable[dict]) -> None:
        self._documents = list(documents)

    def search_opportunities(self, terms: list[str], filters: dict[str, str] | None = None, limit: int = 5) -> list[dict]:
        filters = filters or {}
        normalized_terms = [term.lower() for term in terms if term]
        if not self._documents:
            return []

        scored: list[tuple[int, dict]] = []
        for item in self._documents:
            if filters.get("campus") and item.get("campus") not in {filters["campus"], "All Campuses", "Cross-campus"}:
                continue
            haystack = " ".join(
                [
                    item.get("title", ""),
                    item.get("type", ""),
                    item.get("campus", ""),
                    item.get("faculty", ""),
                    item.get("summary", ""),
                    item.get("detailed_description", ""),
                    " ".join(item.get("tags", [])),
                    " ".join(item.get("related_roles", [])),
                    " ".join(item.get("related_skills", [])),
                ]
            ).lower()
            score = sum(4 if term in item.get("title", "").lower() else 0 for term in normalized_terms)
            score += sum(3 for term in normalized_terms if term in " ".join(item.get("tags", [])).lower())
            score += sum(2 for term in normalized_terms if term in haystack)
            if filters.get("faculty") and filters["faculty"].lower() in item.get("faculty", "").lower():
                score += 2
            if score > 0:
                scored.append((score, item))

        scored.sort(key=lambda pair: pair[0], reverse=True)
        return [item for _, item in scored[:limit]]

    def search_related_terms(self, terms: list[str]) -> list[str]:
        if not terms:
            return []
        return list(dict.fromkeys(term.strip().lower() for term in terms if term.strip()))[:8]
