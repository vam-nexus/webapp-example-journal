from __future__ import annotations

from fastapi import APIRouter

from app.api import admin, public, user

router = APIRouter(prefix="/api")

router.include_router(public.router, prefix="/public", tags=["public"])
router.include_router(user.router, prefix="/user", tags=["user"])
router.include_router(admin.router, prefix="/admin", tags=["admin"])
