---
trigger: always_on
---

# UI Frontend Guidelines

## Tech Stack
- **Marketing Site**: Astro (`frontend/web`)
- **Journal App**: React + Vite (`frontend/app`)
- **Styling**: Vanilla CSS using shared theme tokens.

## Design Philosophy
- **Aesthetic**: Warm, friendly, and premium.
- **Theme**: MUST use variables from `frontend/shared/theme.css` (e.g., `--color-bg-warm`, `--font-display`).
- **Components**: specific to the app should live in `frontend/app/src/components`.

## Authentication & Data
- **Auth**: JWT-based.
- **API**:
  - `VITE_API_BASE` points to the FastAPI backend.
  - Public endpoints: `/api/public/*`
  - User endpoints: `/api/user/*` (Require JWT)
  - Admin endpoints: `/api/admin/*` (Require JWT + `is_admin`)

## Development
- Use `npm install` in respective frontend directories.
- Ensure `frontend/app/.env` is configured correctly.
