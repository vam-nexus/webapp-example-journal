# syntax=docker/dockerfile:1
FROM node:20-alpine AS web-build
WORKDIR /app/frontend/web
COPY frontend/web/package.json ./
RUN npm install
COPY frontend/web ./
COPY frontend/shared /app/frontend/shared
RUN npm run build

FROM node:20-alpine AS app-build
WORKDIR /app/frontend/app
COPY frontend/app/package.json ./
COPY frontend/app/vite.config.ts ./
COPY frontend/app/tsconfig.json ./
RUN npm install
COPY frontend/app ./
COPY frontend/shared /app/frontend/shared
RUN npm run build

FROM python:3.11-slim AS backend
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY app ./app
COPY .env ./
COPY --from=web-build /app/frontend/web/dist ./frontend/web/dist
COPY --from=app-build /app/frontend/app/dist ./frontend/app/dist

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
