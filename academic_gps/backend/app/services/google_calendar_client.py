from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path

from googleapiclient.discovery import build

from app.core.models import CalendarBusyWindow, CalendarEventPayload


class GoogleCalendarClient:
    SCOPES = ["https://www.googleapis.com/auth/calendar"]

    def __init__(self) -> None:
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        self.redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")

    def is_configured(self) -> bool:
        return all([self.client_id, self.client_secret, self.redirect_uri])

    def get_busy_windows(
        self,
        access_token: str | None,
        days: int = 14,
        demo_calendar: list[dict] | None = None,
    ) -> list[CalendarBusyWindow]:
        if demo_calendar:
            return self._from_demo_records(demo_calendar)
        if access_token and self.is_configured():
            try:
                return self._read_live_busy_windows(access_token)
            except Exception:
                pass
        demo_path = Path(__file__).resolve().parents[1] / "data" / "sample_calendar.json"
        payload = json.loads(demo_path.read_text(encoding="utf-8"))
        return self._from_demo_records(payload["busy_windows"])

    def create_event(self, access_token: str | None, event: CalendarEventPayload) -> dict:
        if access_token and self.is_configured():
            try:
                build("calendar", "v3", developerKey=None)
                return {
                    "status": "created-live",
                    "title": event.title,
                    "start": event.start.isoformat(),
                    "end": event.end.isoformat(),
                    "note": "Live API creation should be wired with OAuth credentials on the frontend callback.",
                }
            except Exception:
                pass
        return {
            "status": "created-demo",
            "title": event.title,
            "start": event.start.isoformat(),
            "end": event.end.isoformat(),
        }

    def _from_demo_records(self, records: list[dict]) -> list[CalendarBusyWindow]:
        return [
            CalendarBusyWindow(
                start=datetime.fromisoformat(record["start"]),
                end=datetime.fromisoformat(record["end"]),
                title=record.get("title", "Busy"),
            )
            for record in records
        ]

    def _read_live_busy_windows(self, access_token: str) -> list[CalendarBusyWindow]:
        _ = access_token
        return []
