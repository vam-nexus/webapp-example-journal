# Architecture

## Overview
- FastAPI backend serves JSON APIs under `/api` and optionally serves built frontend assets.
- Astro web site is mounted at `/` in production (served by FastAPI when built).
- React app is mounted at `/app` in production (served by FastAPI when built).

## Runtime components
- `app/main.py`: FastAPI app, CORS, static mounts.
- `app/api/*`: route groups for public, user, and admin endpoints.
- `app/services/journal_service.py`: internal service for entries and settings.
- `frontend/web`: marketing site (Astro).
- `frontend/app`: journaling UI (React + Vite).

## Data flow
1) UI calls `/api/public/login` to obtain a JWT token.
2) UI uses JWT for `/api/user/*` endpoints.
3) The journal service stores entries in memory per user.

## Auth
- JWT tokens include `sub`, `username`, and `is_admin`.
- User routes require any valid token.
- Admin routes require `is_admin = true`.

## Static mounting
- `frontend/web/dist` -> `/`
- `frontend/app/dist` -> `/app`

## Environment
- `.env` configures JWT, CORS, and frontend dist paths.
