# Local Development Modes — Architecture & Workflow

Архитектура локальной среды с переключением между режимами: local full-stack, local frontend + beta API, beta deployed.

---

## 1. Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│ MODE A: Local Full-Stack                                                 │
│   Frontend (dev) ──► Local API (:8000) ──► Local Postgres/Redis        │
│   Data: snapshot from VPS (sanitized)                                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ MODE B: Local Frontend + Beta API                                        │
│   Frontend (dev) ──► Beta API (https://vpn.example.com/api/v1)            │
│   Data: live beta (read/write on beta)                                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ MODE C: Beta Deployed                                                    │
│   Browser ──► https://vpn.example.com/admin (deployed frontend + API)    │
│   Smoke test after deploy                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

| Компонент | Local Full-Stack | Local + Beta API | Beta Deployed |
|-----------|------------------|------------------|---------------|
| Frontend | local dev server | local dev server | deployed |
| API | local Docker | beta VPS | beta VPS |
| Postgres/Redis | local Docker | beta VPS | beta VPS |
| Data | snapshot (sanitized) | live beta | live beta |

---

## 2. UI Testing Workflow

### Mode A: Frontend vs Local Backend

**Когда:** основная разработка, тесты на реалистичных данных без риска для beta.

```bash
./manage.sh up-core
./infra/scripts/runtime/refresh-local-from-vps.sh   # если нужны свежие данные
pnpm dev:admin         # или dev:miniapp
# Admin: http://localhost:5174/admin/
# API proxy: /api → localhost:8000 (vite proxy)
```

**VITE_API_BASE_URL:** не задавать — используется proxy на localhost:8000.

### Mode B: Frontend vs Beta API

**Когда:** проверка UI против live beta (данные, интеграции), без деплоя frontend.

```bash
VITE_API_BASE_URL=https://YOUR_BETA_DOMAIN/api/v1 pnpm dev:admin
# Admin: http://localhost:5174/admin/
# API: запросы идут на beta
```

**Требования:** CORS на beta должен разрешать `http://localhost:5174`. В `.env` на VPS:
```
CORS_ALLOW_ORIGINS=http://localhost:5174,http://127.0.0.1:5174
```

### Mode C: Beta Deployed

**Когда:** финальная проверка после push, smoke test.

```bash
# После git push и деплоя
open https://YOUR_BETA_DOMAIN/admin
```

---

## 3. Env Design

### .env.local (local full-stack)

Переопределяет `.env` для локальной разработки. Не коммитить.

```bash
# .env.local
ENVIRONMENT=development
PUBLIC_DOMAIN=localhost
SECRET_KEY=local-dev-secret-key-min-32-chars
ADMIN_EMAIL=admin@local
ADMIN_PASSWORD=admin-password-12

# Отключить интеграции
BOT_TOKEN=
TELEGRAM_BOT_TOKEN=
TELEGRAM_STARS_WEBHOOK_SECRET=
AGENT_SHARED_TOKEN=
VITE_POSTHOG_KEY=
VITE_ANALYTICS_ENABLED=0
```

Использование: `cp .env.example .env` и переопределить нужные переменные, или `set -a && source .env.local && set +a` перед `docker compose`.

### .env.beta-preview (frontend vs beta API)

Шаблон: `.env.beta-preview.example`. Копировать в `apps/admin-web/.env.local`:

```bash
cp .env.beta-preview.example apps/admin-web/.env.local
# Отредактировать VITE_API_BASE_URL
pnpm dev:admin
```

Или через скрипт: `BETA_API_URL=https://vpn.example.com/api/v1 ./infra/scripts/runtime/dev-admin-beta.sh`

### Переключение API Base URL

| Режим | VITE_API_BASE_URL | Результат |
|-------|--------------------|-----------|
| Local full-stack | не задан | Proxy → localhost:8000 |
| Beta API | `https://vpn.example.com/api/v1` | Прямые запросы на beta |

---

## 4. Data Flow

| Шаг | Команда |
|-----|---------|
| Dump на VPS | `ssh deploy@VPS "cd /opt/vpn-suite && ./manage.sh backup-db"` |
| Download | `./infra/scripts/runtime/dump-db-from-vps.sh` |
| Restore | `./infra/scripts/runtime/restore-db-local.sh` |
| Sanitize | `./infra/scripts/runtime/sanitize-local-db.sh` |
| Full refresh | `./infra/scripts/runtime/refresh-local-from-vps.sh` |

Подробнее: [local-first-data-sync.md](local-first-data-sync.md)

---

## 5. Commands & Scripts

### Exact Commands

```bash
# --- Local Full-Stack ---
./manage.sh up-core
./infra/scripts/runtime/refresh-local-from-vps.sh   # опционально
pnpm dev:admin
# Admin: http://localhost:5174/admin/

# --- Frontend vs Beta API ---
VITE_API_BASE_URL=https://vpn.example.com/api/v1 pnpm dev:admin

# --- Dump / Restore / Sanitize ---
VPS_HOST=deploy@vpn.example.com ./infra/scripts/runtime/dump-db-from-vps.sh
./manage.sh up-core
./infra/scripts/runtime/restore-db-local.sh
./infra/scripts/runtime/sanitize-local-db.sh

# --- Backend only (без Docker) ---
cd apps/admin-api && .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
# Требует: postgres, redis (./manage.sh up-core для них)
```

### Helper Scripts

| Скрипт | Назначение |
|--------|------------|
| `infra/scripts/runtime/dev-admin-local.sh` | Запуск admin dev (local API) |
| `infra/scripts/runtime/dev-admin-beta.sh` | Запуск admin dev (beta API) |

---

## 6. Recommended Workflow

### Daily Local Dev

1. `./manage.sh up-core`
2. При необходимости: `./infra/scripts/runtime/refresh-local-from-vps.sh`
3. `pnpm dev:admin` (или `dev:miniapp`)
4. Разработка, тесты, `./manage.sh check`

### Pre-Push Interface Testing

1. `./manage.sh check`
2. Локально: проверить ключевые экраны в Mode A
3. Опционально: Mode B для проверки против beta API
4. `git add -A && git status && git diff --stat`
5. `git commit && git push origin beta-release`

### Push to Beta

1. `git push origin beta-release`
2. Дождаться деплоя (webhook/CI)

### Final Beta Smoke Test

1. Открыть https://YOUR_BETA_DOMAIN/admin
2. Логин, проверка основных flow
3. При проблемах — логи на VPS, фикс локально, повторный push

---

## 7. Safety Rules

| Правило | Описание |
|---------|----------|
| VPS не IDE | Разработка, git, тесты — только локально |
| Нет прямого доступа к prod DB | Только pg_dump → download → restore |
| Нет prod секретов локально | SECRET_KEY, BOT_TOKEN и т.д. — локальные или пустые |
| Тяжёлые тесты не на VPS | E2E, load tests — локально или в CI |
| CORS для Mode B | Добавить localhost:5174 на beta, не открывать широко |
