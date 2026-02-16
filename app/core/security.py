from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import Cookie, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.core.config import settings


class User(BaseModel):
    id: str
    username: str
    is_admin: bool = False


DUMMY_USERS = {
    "demo": User(id="user-1", username="demo", is_admin=False),
    "admin": User(id="user-2", username="admin", is_admin=True),
}

# In-memory registry for OAuth users
USER_REGISTRY: dict[str, User] = {}


def create_or_update_user(email: str, name: str) -> User:
    """Create or update a user from OAuth profile data."""
    user_id = f"oauth-{email}"
    
    if user_id in USER_REGISTRY:
        user = USER_REGISTRY[user_id]
    else:
        user = User(
            id=user_id,
            username=name or email.split("@")[0],
            is_admin=False,
        )
        USER_REGISTRY[user_id] = user
    
    return user


def create_access_token(user: User) -> str:
    expire_at = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": user.id,
        "username": user.username,
        "is_admin": user.is_admin,
        "exp": expire_at,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> User:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    return User(
        id=str(payload.get("sub")),
        username=str(payload.get("username")),
        is_admin=bool(payload.get("is_admin")),
    )


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user_from_cookie(
    request: Request,
    access_token: Optional[str] = Cookie(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> User:
    """Get current user from cookie or Authorization header (fallback)."""
    token = None
    
    # Try cookie first
    if access_token:
        token = access_token
    # Fall back to Authorization header
    elif credentials:
        token = credentials.credentials
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    return decode_token(token)


# Keep the old function name for backwards compatibility
def get_current_user(
    user: User = Depends(get_current_user_from_cookie),
) -> User:
    return user


def get_admin_user(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def authenticate_dummy(username: str) -> Optional[User]:
    return DUMMY_USERS.get(username)
