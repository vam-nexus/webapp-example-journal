from __future__ import annotations

from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "journal-app"
    env: str = "dev"

    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24

    cors_origins: List[str] = ["http://localhost:4321", "http://localhost:5173"]

    frontend_web_dist: str = "frontend/web/dist"
    frontend_app_dist: str = "frontend/app/dist"

    frontend_web_dev_url: str | None = None
    frontend_app_dev_url: str | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_origins(cls, value: str | List[str]) -> List[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


settings = Settings()
