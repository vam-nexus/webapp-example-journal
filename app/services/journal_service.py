from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from threading import Lock
from typing import Dict, List
from uuid import uuid4

from app.models.journal import JournalEntry, JournalEntryCreate, MoodCalendarDay, Settings


class JournalService:
    def __init__(self) -> None:
        self._entries: Dict[str, List[JournalEntry]] = defaultdict(list)
        self._settings: Dict[str, Settings] = {}
        self._lock = Lock()

    def list_entries(self, user_id: str) -> List[JournalEntry]:
        return list(self._entries.get(user_id, []))

    def create_entry(self, user_id: str, payload: JournalEntryCreate) -> JournalEntry:
        entry_datetime = payload.entry_datetime or datetime.utcnow()
        entry = JournalEntry(
            id=str(uuid4()),
            text=payload.text,
            mood=payload.mood,
            entry_datetime=entry_datetime,
        )
        with self._lock:
            self._entries[user_id].insert(0, entry)
        return entry

    def mood_calendar(self, user_id: str) -> List[MoodCalendarDay]:
        entries = self._entries.get(user_id, [])
        grouped: Dict[str, List[int]] = defaultdict(list)
        for entry in entries:
            date_key = entry.entry_datetime.date().isoformat()
            grouped[date_key].append(entry.mood)

        days: List[MoodCalendarDay] = []
        for date_key, moods in sorted(grouped.items(), reverse=True):
            avg = sum(moods) / len(moods)
            days.append(MoodCalendarDay(date=date_key, average_mood=avg, entries=len(moods)))
        return days

    def get_settings(self, user_id: str) -> Settings:
        if user_id not in self._settings:
            self._settings[user_id] = Settings()
        return self._settings[user_id]

    def update_settings(self, user_id: str, settings: Settings) -> Settings:
        self._settings[user_id] = settings
        return settings


journal_service = JournalService()
