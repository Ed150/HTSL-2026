from __future__ import annotations

from datetime import datetime, timedelta, time

from app.core.models import ActionItem, CalendarBusyWindow, CalendarPlanResponse, CalendarSlot, WeeklyPlanItem


class Scheduler:
    def create_plan(
        self,
        actions: list[ActionItem],
        busy_windows: list[CalendarBusyWindow],
        days: int = 14,
    ) -> CalendarPlanResponse:
        free_slots = self.find_free_slots(busy_windows, days=days)
        ranked_actions = sorted(
            actions,
            key=lambda item: (item.urgency * 0.55 + item.value_score * 0.45, -item.estimated_minutes),
            reverse=True,
        )

        scheduled: list[WeeklyPlanItem] = []
        remaining_slots = free_slots.copy()
        unscheduled: list[ActionItem] = []

        for action in ranked_actions:
            minutes = timedelta(minutes=action.estimated_minutes)
            chosen_index = None
            for index, slot in enumerate(remaining_slots):
                if slot.end - slot.start >= minutes:
                    start = slot.start
                    end = start + minutes
                    scheduled.append(
                        WeeklyPlanItem(
                            action_id=action.id,
                            title=action.title,
                            start=start,
                            end=end,
                            rationale=f"Scheduled in a high-quality free window: {slot.note}",
                        )
                    )
                    if slot.end - end >= timedelta(minutes=15):
                        remaining_slots[index] = CalendarSlot(
                            start=end,
                            end=slot.end,
                            score=slot.score - 0.05,
                            note=slot.note,
                        )
                    else:
                        chosen_index = index
                    break
            else:
                unscheduled.append(action)
                continue

            if chosen_index is not None:
                remaining_slots.pop(chosen_index)

        summary = (
            f"Scheduled {len(scheduled)} action(s) across the next {days} days and left "
            f"{len(unscheduled)} action(s) unscheduled for manual review."
        )
        return CalendarPlanResponse(
            scheduled_actions=scheduled,
            unscheduled_actions=unscheduled,
            free_slots=free_slots[:10],
            summary=summary,
        )

    def find_free_slots(self, busy_windows: list[CalendarBusyWindow], days: int = 14) -> list[CalendarSlot]:
        now = datetime.now().replace(second=0, microsecond=0)
        day_start = time(hour=9, minute=0)
        day_end = time(hour=20, minute=0)
        busy = sorted(busy_windows, key=lambda window: window.start)
        slots: list[CalendarSlot] = []

        for offset in range(days):
            current_day = (now + timedelta(days=offset)).date()
            cursor = datetime.combine(current_day, day_start)
            end_of_day = datetime.combine(current_day, day_end)
            day_busy = [window for window in busy if window.start.date() == current_day]
            for window in day_busy:
                if window.start > cursor:
                    slots.append(self._score_slot(cursor, window.start))
                cursor = max(cursor, window.end)
            if cursor < end_of_day:
                slots.append(self._score_slot(cursor, end_of_day))

        return [slot for slot in slots if slot.end - slot.start >= timedelta(minutes=30)]

    def _score_slot(self, start: datetime, end: datetime) -> CalendarSlot:
        duration_hours = (end - start).total_seconds() / 3600
        afternoon_bonus = 0.15 if 13 <= start.hour <= 17 else 0.0
        morning_bonus = 0.1 if 9 <= start.hour <= 11 else 0.0
        score = min(1.0, 0.35 + duration_hours / 4 + afternoon_bonus + morning_bonus)
        return CalendarSlot(
            start=start,
            end=end,
            score=round(score, 3),
            note=f"{'Afternoon' if start.hour >= 12 else 'Morning'} focus window",
        )
