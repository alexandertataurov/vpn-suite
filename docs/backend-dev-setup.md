# Backend dev setup (pytest and local run)

Run backend tests and the API locally without Docker.

## Prerequisites

- Python 3.10+ (3.12 recommended)
- PostgreSQL and Redis (e.g. `docker compose up -d postgres redis` from repo root, or local installs)

## 1. Venv and dependencies

```bash
cd backend

# Option A: venv + pip
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.in

# Option B: uv
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt -r requirements-dev.in
```

## 2. Environment

Tests expect these (defaults are fine for local pytest):

```bash
export DATABASE_URL="${DATABASE_URL:-postgresql+asyncpg://postgres:postgres@localhost:5432/vpn_admin}"
export REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}"
export SECRET_KEY="${SECRET_KEY:-dev-secret-key-min-32-chars}"
export NODE_MODE="${NODE_MODE:-mock}"
export TELEGRAM_STARS_WEBHOOK_SECRET="${TELEGRAM_STARS_WEBHOOK_SECRET:-}"
```

Optional: `ADMIN_EMAIL`, `ADMIN_PASSWORD` for seeded admin user.

## 3. Migrations

```bash
alembic upgrade head
```

## 4. Run tests

```bash
pytest tests/ -v
# or
python3 -m pytest tests/ -v
```

One-liner from repo root (with postgres/redis up):

```bash
cd backend && NODE_MODE=mock TELEGRAM_STARS_WEBHOOK_SECRET="" pytest tests/ -v
```

See also: `scripts/quality_gate.sh`, `scripts/verify.sh`.
