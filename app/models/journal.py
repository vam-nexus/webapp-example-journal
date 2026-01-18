from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class JournalEntryCreate(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    mood: int = Field(ge=1, le=10)
    entry_datetime: Optional[datetime] = None


class JournalEntry(BaseModel):
    id: str
    text: str
    mood: int
    entry_datetime: datetime


class MoodCalendarDay(BaseModel):
    date: str
    average_mood: float
    entries: int


class JournalListResponse(BaseModel):
    items: List[JournalEntry]


class MoodCalendarResponse(BaseModel):
    days: List[MoodCalendarDay]


class Settings(BaseModel):
    display_name: str = "Friend"
    reminder_time: str = "20:00"
    theme: str = "warm"
