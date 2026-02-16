from __future__ import annotations

from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from starlette.config import Config

from app.core.config import settings
from app.core.security import create_access_token, create_or_update_user

router = APIRouter()

# Configure OAuth
config = Config(environ={
    "GOOGLE_CLIENT_ID": settings.google_client_id,
    "GOOGLE_CLIENT_SECRET": settings.google_client_secret,
})

oauth = OAuth(config)
oauth.register(
    name="google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@router.get("/google/login")
async def google_login(request: Request):
    """Initiate Google OAuth flow."""
    # Build redirect URI from the request's base URL
    # This works in both dev (localhost) and production (actual domain)
    base_url = str(request.base_url).rstrip("/")
    redirect_uri = f"{base_url}/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request):
    """Handle Google OAuth callback."""
    try:
        # Exchange authorization code for access token
        token = await oauth.google.authorize_access_token(request)
        
        # Get user info from Google
        user_info = token.get("userinfo")
        if not user_info:
            user_info = await oauth.google.userinfo(token=token)
        
        # Extract user data
        email = user_info.get("email")
        name = user_info.get("name", "")
        
        if not email:
            # Redirect to frontend with error
            frontend_url = settings.frontend_app_dev_url or "/app"
            return RedirectResponse(url=f"{frontend_url}?error=no_email")
        
        # Create or update user
        user = create_or_update_user(email, name)
        
        # Generate JWT token
        jwt_token = create_access_token(user)
        
        # Redirect to frontend and set httpOnly cookie
        frontend_url = settings.frontend_app_dev_url or "/app"
        response = RedirectResponse(url=frontend_url)
        
        # Set JWT in httpOnly cookie
        response.set_cookie(
            key="access_token",
            value=jwt_token,
            httponly=True,
            secure=settings.env == "prod",  # HTTPS only in production
            samesite="lax",
            max_age=settings.jwt_expire_minutes * 60,  # Convert minutes to seconds
        )
        
        return response
        
    except Exception as e:
        # Redirect to frontend with error
        frontend_url = settings.frontend_app_dev_url or "/app"
        return RedirectResponse(url=f"{frontend_url}?error={str(e)}")
