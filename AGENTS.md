# AGENTS

Project-specific guidance for Codex agents.

## Essentials
- Use `uv` for Python dependency management and commands.
- Keep `README.md` and `specs/*.md` in sync with code changes.
- Prefer `rg` for searches.
- Maintain verbose logs and avoid unnecessary fallbacks.

## Entry points
- Backend: `app/main.py`
- Web (Astro): `frontend/web`
- App (React): `frontend/app`

## Startup
- Use `scripts/start.ps1` to run backend + both frontends.
