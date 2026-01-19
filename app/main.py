from __future__ import annotations

from pathlib import Path
from typing import Dict

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
import httpx

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

# Add session middleware for OAuth
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.jwt_secret,  # Use JWT secret for session encryption
)

app.include_router(api_router)

# Mount auth router directly at /auth to match Google OAuth redirect URI
from app.api.auth import router as auth_router
app.include_router(auth_router, prefix="/auth", tags=["auth"])

# Redirect /app to /app/ to handle trailing slash
@app.get("/app")
async def redirect_app():
    return RedirectResponse(url="/app/", status_code=301)

web_dist = Path(settings.frontend_web_dist)
app_dist = Path(settings.frontend_app_dist)

if app_dist.exists():
    app.mount("/app", StaticFiles(directory=str(app_dist), html=True), name="app")

if web_dist.exists():
    app.mount("/", StaticFiles(directory=str(web_dist), html=True), name="web")


async def _proxy_request(target_base: str, path: str, request: Request) -> Response:
    target_url = f"{target_base.rstrip('/')}/{path.lstrip('/')}"
    headers: Dict[str, str] = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in {"host", "content-length"}
    }
    body = await request.body()
    async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
        proxied = await client.request(
            request.method,
            target_url,
            headers=headers,
            content=body,
            params=request.query_params,
        )
    return Response(
        content=proxied.content,
        status_code=proxied.status_code,
        headers={key: value for key, value in proxied.headers.items() if key.lower() != "content-encoding"},
    )


if settings.frontend_app_dev_url:
    @app.api_route("/app", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], include_in_schema=False)
    @app.api_route("/app/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], include_in_schema=False)
    async def proxy_app(request: Request, path: str = "") -> Response:
        return await _proxy_request(settings.frontend_app_dev_url, path, request)


if settings.frontend_web_dev_url:
    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], include_in_schema=False)
    async def proxy_web(request: Request, path: str) -> Response:
        if path.startswith("api"):
            return Response(status_code=404)
        return await _proxy_request(settings.frontend_web_dev_url, path, request)
