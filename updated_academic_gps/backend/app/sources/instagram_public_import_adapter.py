from __future__ import annotations


class InstagramPublicImportAdapter:
    """Demo-safe import adapter for manually supplied public Instagram metadata."""

    def load(self, items: list[dict] | None = None) -> list[dict]:
        if not items:
            return []
        return [
            {
                **item,
                "source": item.get("source", "Instagram public import"),
                "compliance_note": "Imported from public URLs or user-curated exports. No login-gated scraping.",
            }
            for item in items
        ]
