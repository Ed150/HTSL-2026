from __future__ import annotations


class LinkedInPublicImportAdapter:
    """Demo-safe import adapter for manually supplied public LinkedIn metadata."""

    def load(self, items: list[dict] | None = None) -> list[dict]:
        if not items:
            return []
        return [
            {
                **item,
                "source": item.get("source", "LinkedIn public import"),
                "compliance_note": "Imported from user-supplied public metadata. No logged-in or protected scraping.",
            }
            for item in items
        ]
