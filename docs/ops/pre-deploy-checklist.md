# Pre-Deploy Checklist & Test Plan — VPN Suite

Практичный инженерный чеклист перед push/deploy в beta. Не абстрактный QA-документ — конкретные проверки.

---

## Section 1: Pre-Commit Checklist

- [ ] `git status` — нет случайных файлов в staged
- [ ] `git diff --stat` — изменения ожидаемые
- [ ] `git diff` — нет `.env`, `secrets/`, `*.pem`, паролей, токенов
- [ ] `.gitignore` покрывает `node_modules/`, `dist/`, `.venv/`, `snapshots/`, `backups/`
- [ ] Миграции: если менял модели — `alembic revision` создан, `upgrade head` проходит
- [ ] `backend/alembic/versions/` — нет конфликтующих head
- [ ] Конфиги: `./manage.sh config-validate` — OK
- [ ] Нет `console.log`, `print(debug)`, `# TODO` без issue
- [ ] `./manage.sh check` — ruff, pytest, frontend lint/typecheck/test/build

---

## Section 2: Local Pre-Deploy Checklist

- [ ] `./manage.sh up-core` — все сервисы healthy
- [ ] `curl -sf http://127.0.0.1:8000/health` → 200
- [ ] `curl -sf http://127.0.0.1:8000/health/ready` → 200
- [ ] Postgres: `docker compose exec postgres pg_isready -U postgres` → OK
- [ ] Redis: `docker compose exec redis redis-cli ping` → PONG
- [ ] Логи: `docker compose logs admin-api --tail 50` — нет traceback, критичных ERROR
- [ ] `cd frontend && pnpm dev:admin` — dev server стартует
- [ ] `cd frontend && pnpm build:admin` — сборка без ошибок
- [ ] Admin UI: http://localhost:5174/admin/ — открывается
- [ ] Логин: POST `/api/v1/auth/login` с ADMIN_EMAIL/ADMIN_PASSWORD → 200 + token

---

## Section 3: UI Smoke Test Plan

### Auth
- [ ] Login — ввод email/password → редирект на /
- [ ] Logout — кнопка/меню → редирект на /login
- [ ] Невалидный логин → ошибка, не 500

### Navigation
- [ ] Dashboard (/) — загружается
- [ ] Servers → /servers, /servers/nodes
- [ ] Users → /users
- [ ] Devices → /devices
- [ ] Billing → /billing
- [ ] Telemetry → /telemetry
- [ ] Settings → /settings

### Data
- [ ] Overview — карточки/метрики отображаются (или empty state)
- [ ] Списки (users, servers, devices) — загружаются или empty state
- [ ] Карточка сущности — открывается, данные видны

### Create/Edit Flow (если есть)
- [ ] Create — форма, submit → success/redirect
- [ ] Edit — форма предзаполнена, save → success

### States
- [ ] Empty state — списки без данных показывают placeholder
- [ ] Loading — спиннер/скелетон при загрузке
- [ ] Error — 4xx/5xx показывают сообщение, не белый экран

### DevTools
- [ ] Console — нет красных ошибок (кроме ожидаемых)
- [ ] Network — нет 500 на ключевых запросах

---

## Section 4: Backend / API Smoke Test

- [ ] `GET /health` → 200, JSON с `node_mode`
- [ ] `GET /health/ready` → 200 (при DB+Redis OK)
- [ ] `POST /api/v1/auth/login` → 200 + access_token
- [ ] `GET /api/v1/servers` с Bearer → 200
- [ ] `GET /api/v1/overview/health-snapshot` с Bearer → 200
- [ ] Нет 500 на основных CRUD (GET list, GET detail)
- [ ] `./manage.sh migrate` — upgrade head без ошибок
- [ ] Логи: `docker compose logs admin-api --tail 100` — нет traceback
- [ ] `DATABASE_URL` не указывает на prod

---

## Section 5: Data Validation

- [ ] Snapshot: если используешь dump — `snapshots/*.dump` от beta/staging, не prod
- [ ] Ключевые таблицы: `users`, `servers` — не пустые или ожидаемо пустые
- [ ] Тестовый админ: `ADMIN_EMAIL`/`ADMIN_PASSWORD` из `.env` — есть в DB (seed выполнен)
- [ ] UI отображает реалистичные данные (или корректный empty state)
- [ ] Локально: `SECRET_KEY`, `BOT_TOKEN`, `AGENT_SHARED_TOKEN` — не prod значения
- [ ] Интеграции: `BOT_TOKEN=`, `TELEGRAM_STARS_WEBHOOK_SECRET=` — отключены или mock

---

## Section 6: Local Frontend + Beta API Check

Режим: frontend локально, API = beta VPS.

### Admin (`dev:admin`, порт 5174)

- [ ] `VITE_API_BASE_URL=https://BETA_DOMAIN/api/v1` задан
- [ ] `cd frontend && VITE_API_BASE_URL=... pnpm dev:admin` — стартует
- [ ] CORS на beta: `CORS_ALLOW_ORIGINS` включает `http://localhost:5174`
- [ ] Login → 200, token получен
- [ ] Dashboard загружает данные с beta
- [ ] Нет CORS errors в console
- [ ] Контракты: поля API совпадают с ожиданиями UI (нет 400/422 из-за схемы)
- [ ] UI корректно отображает staging data

### Telegram Mini App (`frontend/miniapp`, порт 5175, `base: /webapp/`)

- [ ] Тот же `VITE_API_BASE_URL=https://BETA_DOMAIN/api/v1`, если грузишь Vite с другого origin, чем API
- [ ] `cd frontend/miniapp && VITE_API_BASE_URL=... pnpm dev` — стартует; без переменной dev использует proxy `/api` → `localhost:8000`
- [ ] CORS: `CORS_ALLOW_ORIGINS` включает `http://localhost:5175` (и прод-домен WebApp, если отличается)
- [ ] В Network виден `POST /api/v1/webapp/auth` на ожидаемый хост

---

## Section 7: Post-Deploy Beta Checklist

- [ ] Commit SHA на VPS совпадает с push: `git rev-parse HEAD` vs `docker compose exec admin-api cat /app/.git-rev 2>/dev/null || docker inspect ...`
- [ ] `docker compose ps` — admin-api, postgres, redis, reverse-proxy, bot — Up
- [ ] `curl -sf https://BETA_DOMAIN/health` → 200
- [ ] Login в админку — работает
- [ ] Dashboard — загружается
- [ ] Ключевые страницы: /servers, /users, /devices — открываются
- [ ] Логи: `docker compose logs admin-api --since 5m` — нет новых traceback, error spike

---

## Section 8: Test Levels Matrix

| Уровень | Время | Проверки |
|---------|-------|----------|
| **2-minute smoke** | ~2 мин | `./manage.sh check`; `curl /health`; логин; dashboard открывается |
| **10-minute pre-release** | ~10 мин | Section 1 + 2 + 4; UI smoke (auth, nav, dashboard, списки); `./manage.sh verify` |
| **Full beta verification** | ~20–30 мин | Все секции 1–7; UI smoke полностью; local+beta API (Section 6); post-deploy (Section 7) |

### 2-minute smoke

```bash
./manage.sh pre-deploy-smoke
# или: bash scripts/pre_deploy_smoke.sh 2min
# Пропустить check: PRE_DEPLOY_SKIP_CHECK=1 ./manage.sh pre-deploy-smoke
```

### 10-minute pre-release

```bash
./manage.sh pre-deploy-verify
# или: bash scripts/pre_deploy_smoke.sh 10min
```

### Full beta verification

Выполнить все чеклисты секций 1–7 по порядку.

---

## Quick Reference

| Задача | Команда |
|--------|---------|
| Pre-commit | `git status && git diff --stat` |
| 2-min smoke | `./manage.sh pre-deploy-smoke` |
| 10-min pre-release | `./manage.sh pre-deploy-verify` |
| Quality gate | `./manage.sh check` |
| Full verify | `./manage.sh verify` |
| Core up | `./manage.sh up-core` |
| Health | `curl -sf http://127.0.0.1:8000/health` |
| Config | `./manage.sh config-validate` |
| Frontend build | `cd frontend && pnpm build:admin` |
