from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.security import User, get_current_user
from app.models.journal import (
    JournalEntryCreate,
    JournalListResponse,
    MoodCalendarResponse,
    Settings,
)
from app.services.journal_service import journal_service

router = APIRouter()


@router.get("/journal", response_model=JournalListResponse)
async def list_entries(user: User = Depends(get_current_user)) -> JournalListResponse:
    entries = journal_service.list_entries(user.id)
    return JournalListResponse(items=entries)


@router.post("/journal", response_model=dict)
async def create_entry(
    payload: JournalEntryCreate,
    user: User = Depends(get_current_user),
) -> dict:
    entry = journal_service.create_entry(user.id, payload)
    return {"item": entry}


@router.get("/mood-calendar", response_model=MoodCalendarResponse)
async def mood_calendar(user: User = Depends(get_current_user)) -> MoodCalendarResponse:
    days = journal_service.mood_calendar(user.id)
    return MoodCalendarResponse(days=days)


@router.get("/settings", response_model=Settings)
async def get_settings(user: User = Depends(get_current_user)) -> Settings:
    return journal_service.get_settings(user.id)


@router.put("/settings", response_model=Settings)
async def update_settings(settings: Settings, user: User = Depends(get_current_user)) -> Settings:
    return journal_service.update_settings(user.id, settings)
