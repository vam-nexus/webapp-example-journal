from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import router as api_router
from app.core.config import settings

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

web_dist = Path(settings.frontend_web_dist)
app_dist = Path(settings.frontend_app_dist)

if app_dist.exists():
    app.mount("/app", StaticFiles(directory=str(app_dist), html=True), name="app")

if web_dist.exists():
    app.mount("/", StaticFiles(directory=str(web_dist), html=True), name="web")
