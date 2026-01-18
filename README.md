# Journal App

Warm, friendly journaling experience with a FastAPI backend, an Astro marketing site, and a React app.

## Stack
- Backend: FastAPI (`app/main.py`)
- Web: Astro (`frontend/web`)
- App: React + Vite (`frontend/app`)

## Local setup (uv + npm)
```powershell
uv sync
cd frontend/web
npm install
cd ../app
npm install
```

Create or adjust `frontend/app/.env` to point at the backend:
```
VITE_API_BASE=http://localhost:8000
```

## Run all components
```powershell
.\scripts\start.ps1
```

Ports:
- Backend: http://localhost:8000
- Web: http://localhost:4321
- App: http://localhost:5173

The backend reads `.env` from the repo root for JWT secrets and CORS settings.

## API highlights
- Public: `/api/public/health`, `/api/public/login?username=demo`
- User: `/api/user/journal`, `/api/user/mood-calendar`, `/api/user/settings`
- Admin: `/api/admin/users`

Authentication is JWT-based with a dummy login. Use `demo` or `admin` as usernames.

## Docker
```bash
docker build -t journal-app .
docker run -p 8000:8000 journal-app
```

## Docs
Architecture and API notes live in `specs/` and should stay in sync with code changes.
