# Local Development Modes — Architecture & Workflow

Default mode for day-to-day work: local full-stack plus local Storybook, with live beta/prod used only when you explicitly need to validate against remote data or a deployed release.

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

## 2. Local-First UI Workflow

Use this as the default loop for both admin and miniapp work:

```bash
./manage.sh up-core
pnpm run storybook:admin
pnpm run storybook:miniapp
pnpm run dev:admin
pnpm run dev:miniapp
```

- `storybook:*` is for isolated component and page-state work without depending on the backend.
- `dev:*` is for routing, API integration, auth, and end-to-end flow testing against the local stack.
- Keep beta/prod out of the normal edit-test loop unless you need a live-data check.

---

## 3. UI Testing Workflow

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

## 4. Env Design

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

### apps/admin-web/.env.local (frontend vs beta API)

Если нужен локальный запуск admin-web против beta API, создать `apps/admin-web/.env.local` вручную:

```bash
cat > apps/admin-web/.env.local <<'EOF'
VITE_API_BASE_URL=https://vpn.example.com/api/v1
EOF
pnpm dev:admin
```

Или через скрипт: `BETA_API_URL=https://vpn.example.com/api/v1 ./infra/scripts/runtime/dev-admin-beta.sh`

### Переключение API Base URL

| Режим | VITE_API_BASE_URL | Результат |
|-------|--------------------|-----------|
| Local full-stack | не задан | Proxy → localhost:8000 |
| Beta API | `https://vpn.example.com/api/v1` | Прямые запросы на beta |

---

## 5. Data Flow

| Шаг | Команда |
|-----|---------|
| Dump на VPS | `ssh deploy@VPS "cd /opt/vpn-suite && ./manage.sh backup-db"` |
| Download | `./infra/scripts/runtime/dump-db-from-vps.sh` |
| Restore | `./infra/scripts/runtime/restore-db-local.sh` |
| Sanitize | `./infra/scripts/runtime/sanitize-local-db.sh` |
| Full refresh | `./infra/scripts/runtime/refresh-local-from-vps.sh` |

Подробнее: [local-first-data-sync.md](local-first-data-sync.md)

---

## 6. Commands & Scripts

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

## 7. Recommended Workflow

### Daily Local Dev

1. `./manage.sh up-core`
2. `pnpm run storybook:admin` или `pnpm run storybook:miniapp` для isolated UI work
3. `pnpm dev:admin` или `pnpm dev:miniapp` для flow testing
4. `./manage.sh check` перед пушем
5. При необходимости: `./infra/scripts/runtime/refresh-local-from-vps.sh` для свежего sanitized snapshot

### Pre-Push Interface Testing

1. `./manage.sh check`
2. `pnpm run test`
3. `pnpm run build`
4. Локально: проверить ключевые экраны в Mode A
5. Опционально: Mode B для проверки против beta API
6. `git add -A && git status && git diff --stat`
7. `git commit && git push origin beta-release`

### Push to Beta

1. Merge reviewed changes to `beta-release`
2. Push `beta-release`
3. Дождаться деплоя (webhook/CI)
4. Запустить `./manage.sh smoke-staging`

### Final Beta Smoke Test

1. Открыть https://YOUR_BETA_DOMAIN/admin
2. Логин, проверка основных flow
3. При проблемах — логи на VPS, фикс локально, повторный push

### Production Promotion

1. После green beta smoke tagнуть reviewed commit
2. Деплоить тот же SHA в production
3. Проверить health, login, and the main user flows before widening access

---

## 8. Safety Rules

| Правило | Описание |
|---------|----------|
| VPS не IDE | Разработка, git, тесты — только локально |
| Нет прямого доступа к prod DB | Только pg_dump → download → restore |
| Нет prod секретов локально | SECRET_KEY, BOT_TOKEN и т.д. — локальные или пустые |
| Тяжёлые тесты не на VPS | E2E, load tests — локально или в CI |
| CORS для Mode B | Добавить localhost:5174 на beta, не открывать широко |
