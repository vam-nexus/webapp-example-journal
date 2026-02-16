from __future__ import annotations

from fastapi import APIRouter, Response

from app.core.config import settings
from app.core.security import authenticate_dummy, create_access_token

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.post("/login")
async def login(username: str, response: Response) -> dict:
    user = authenticate_dummy(username)
    if not user:
        return {"error": "Unknown user", "allowed": ["demo", "admin"]}

    token = create_access_token(user)
    
    # Set JWT in httpOnly cookie
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=settings.env == "prod",  # HTTPS only in production
        samesite="lax",
        max_age=settings.jwt_expire_minutes * 60,  # Convert minutes to seconds
    )
    
    return {"user": user.model_dump()}
