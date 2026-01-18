from __future__ import annotations

from fastapi import APIRouter

from app.core.security import authenticate_dummy, create_access_token

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.post("/login")
async def login(username: str) -> dict:
    user = authenticate_dummy(username)
    if not user:
        return {"error": "Unknown user", "allowed": ["demo", "admin"]}

    token = create_access_token(user)
    return {"access_token": token, "token_type": "bearer", "user": user.model_dump()}
