# Setup

This document explains how to run TRAIL for development and production.

## Prerequisites
- Docker & Docker Compose (recommended)
- Node.js (if running frontend locally)
- Python 3.10+ (if running backend locally)
- An OpenAI API key with sufficient quota

## Environment
Create a `.env` file in project root (do NOT commit). See `.env.example` for template.

Key env vars:
- `OPENAI_API_KEY` — **REQUIRED**
- `APP_SECRET_KEY` — recommended for session/security
- `API_DELAY` — optional default delay (seconds) between AI calls, `0` disables

## Run with Docker (recommended)
Build and start containers:

```bash
docker-compose up --build -d
```

To view logs:

```bash
docker-compose logs -f
```

## Run locally (dev)
- Backend:
  - Create and activate a virtualenv
  - Install requirements: `pip install -r requirements.txt`
  - Run: `uvicorn app.main:app --reload --port 7777`
- Frontend (Next.js):
  - `cd frontend`
  - `npm install`
  - `npm run dev`

## Pre-commit hooks
We use `pre-commit`. Install and run:

```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files
```

If a hook auto-fixes files, stage fixes (`git add`) and commit again.

## Notes
Keep secrets out of source control. Provide `.env.example` for contributors.
