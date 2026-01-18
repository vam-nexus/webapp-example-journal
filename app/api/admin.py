from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.security import DUMMY_USERS, User, get_admin_user

router = APIRouter()


@router.get("/users")
async def list_users(_: User = Depends(get_admin_user)) -> dict:
    return {"items": [user.model_dump() for user in DUMMY_USERS.values()]}
