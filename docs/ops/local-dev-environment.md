# Local Development Environment — VPN Suite

Рекомендуемая архитектура и workflow для локальной разработки на ветке `beta-release`.

---

## 1. Architecture Recommendation

**Рекомендация: WSL2 + Docker Desktop + Cursor/VS Code** (для Windows) или **Linux/macOS + Docker Engine** (для нативных систем).

| ОС | Режим | Причина |
|----|-------|---------|
| Windows | WSL2 + Docker Desktop | Docker Desktop интегрируется с WSL2, Cursor/VS Code работают в WSL. Единая файловая система, нормальная производительность. |
| Linux | Docker Engine + Compose | Нативная поддержка, без лишних слоёв. |
| macOS | Docker Desktop | Стандартный вариант для Mac. |

**Почему не VPS как IDE:** VPS — только runtime/staging. Разработка, тесты, git — локально.

---

## 2. Local Machine Prerequisites

### Checklist

```bash
# 1. Git
git --version  # 2.x+

# 2. Docker
docker --version
docker compose version  # v2+

# 3. Node.js (для frontend dev, pnpm)
node --version   # 20 LTS+
pnpm --version   # 9+

# 4. Python (для backend dev, pytest)
python3 --version  # 3.12

# 5. Bash
bash --version
```

### Установка (Ubuntu/Debian)

```bash
# Git
sudo apt update && sudo apt install -y git

# Docker (официальный репозиторий)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Перелогиниться или: newgrp docker

# Docker Compose (входит в Docker Desktop / docker-ce)
docker compose version

# Node.js 20 LTS (nvm или NodeSource)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc && nvm install 20 && nvm use 20

# pnpm
npm install -g pnpm

# Python 3.12
sudo apt install -y python3.12 python3.12-venv python3-pip
```

### Windows + WSL2

1. Установить WSL2: `wsl --install`
2. Установить Docker Desktop с опцией "Use WSL 2 based engine"
3. В WSL: Node, pnpm, Python — как выше
4. Открывать проект в Cursor/VS Code через `File → Open Folder` → путь WSL (`\\wsl$\Ubuntu\home\...`)

---

## 3. Clone & Setup Commands

```bash
# Clone
git clone https://github.com/alexandertataurov/vpn-suite.git
cd vpn-suite

# Checkout beta-release
git checkout beta-release

# Verify
git branch -a                    # * beta-release
git remote -v                    # origin
git log -1 --oneline            # текущий SHA
git rev-parse HEAD              # полный SHA
```

---

## 4. Env Setup

```bash
cp .env.example .env
# Редактировать .env
```

### Required для локального core stack

| Variable | Локально | Пример |
|----------|----------|--------|
| PUBLIC_DOMAIN | ✓ | `localhost` |
| POSTGRES_PASSWORD | ✓ | `postgres` |
| GRAFANA_ADMIN_PASSWORD | ✓ | `change-me` |
| ALERTMANAGER_IMAGE | ✓ | `prom/alertmanager:v0.27.0` |
| SECRET_KEY | ✓ | ≥32 символов (не prod) |
| ADMIN_EMAIL | ✓ | `admin@example.com` |
| ADMIN_PASSWORD | ✓ | ≥12 символов (не prod) |
| DATABASE_URL | ✓ | `postgresql+asyncpg://postgres:postgres@postgres:5432/vpn_admin` |
| REDIS_URL | ✓ | `redis://redis:6379/0` |

### Optional для core (локально)

| Variable | Когда нужен |
|----------|-------------|
| BOT_TOKEN / TELEGRAM_BOT_TOKEN | Если запускаешь bot |
| VITE_TELEGRAM_BOT_USERNAME | Если нужны referral links |
| AGENT_SHARED_TOKEN | Только для agent mode |
| NODE_MODE | `mock` для dev без node-agent |
| NODE_DISCOVERY | `docker` для single-host |

### Минимальный .env для core (без bot)

```bash
PUBLIC_DOMAIN=localhost
POSTGRES_PASSWORD=postgres
GRAFANA_ADMIN_PASSWORD=change-me
ALERTMANAGER_IMAGE=prom/alertmanager:v0.27.0
SECRET_KEY=local-dev-secret-key-min-32-chars
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin-password-12
# Остальное — из .env.example
```

---

## 5. Minimal Startup Flow

### Только core (без observability, audit, agent)

```bash
./manage.sh up-core
```

Поднимает: postgres, redis, admin-api, admin-worker, reverse-proxy, telegram-vpn-bot.

### Не поднимать по умолчанию

- `./manage.sh up-monitoring` — Prometheus, Grafana, Loki и т.д.
- `infra/compose/docker-compose.audit.yml` — audit stack
- `./manage.sh up-agent` — node-agent (нужен DOCKER_GID, agent certs)

### Остановка

```bash
./manage.sh down-core
```

### Bootstrap (полный one-shot, включая agent)

```bash
# Только если нужен agent mode
./manage.sh bootstrap
```

---

## 6. Component-by-Component Dev Workflow

### Backend

| Действие | Команда |
|----------|---------|
| Рабочая папка | `apps/admin-api/` |
| Запуск | Core stack (`./manage.sh up-core`), API на 127.0.0.1:8000 |
| Dev без Docker | `cd apps/admin-api && .venv/bin/uvicorn app.main:app --reload` (нужны postgres, redis) |
| Тесты | `cd apps/admin-api && .venv/bin/python -m pytest tests/ -v` |
| Venv | `./manage.sh setup-backend-venv` |

Не поднимать: monitoring, audit, node-agent (если не нужен).

### Frontend (admin SPA)

| Действие | Команда |
|----------|---------|
| Рабочая папка | `apps/admin-web/` |
| Dev server | `pnpm dev:admin` |
| Зависимости | Core (admin-api, reverse-proxy) |
| Сборка | `pnpm build:admin` |

### Frontend (miniapp)

| Действие | Команда |
|----------|---------|
| Рабочая папка | `apps/miniapp/` |
| Dev server | `pnpm dev:miniapp` |
| Сборка | `pnpm build:miniapp` |

### Bot

| Действие | Команда |
|----------|---------|
| Рабочая папка | `apps/telegram-bot/` |
| Запуск | Входит в `up-core` (telegram-vpn-bot) |
| Пересборка | `./manage.sh build-bot` |

### Node-agent

| Действие | Команда |
|----------|---------|
| Рабочая папка | `apps/node-agent/` |
| Запуск | `./manage.sh up-agent` (только при необходимости) |
| Требования | DOCKER_GID, agent certs, core up |

---

## 7. Git Visibility Workflow

### Before commit

```bash
git status
git diff
git diff --stat
git diff --name-only
git log -5 --oneline
```

### Before push

```bash
git fetch origin
git log origin/beta-release..HEAD --oneline   # локальные коммиты
git diff origin/beta-release..HEAD --stat    # изменения vs remote
git rev-parse HEAD
git rev-parse origin/beta-release
```

### Краткий routine

```bash
git status && git diff --stat && git log -3 --oneline
```

---

## 8. Cursor / VS Code Safe Config

### Рекомендации

- Открывать весь repo (корень `vpn-suite`), не отдельные папки.
- Исключить из index/watch тяжёлые директории через локальные настройки редактора, а не через файлы, которые живут в репозитории.

### VS Code settings (опционально)

```json
{
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/.venv/**": true,
    "**/backups/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.venv": true
  }
}
```

---

## 9. Testing Guidance

### Локально, безопасно

| Команда | Назначение |
|---------|------------|
| `./manage.sh check` | ruff, pytest, frontend lint/typecheck/test/build (без E2E) |
| `./manage.sh verify` | Полный gate + migrate integrity, config-validate |

### Точечные проверки

```bash
# Backend
cd apps/admin-api && .venv/bin/python -m pytest tests/unit -v

# Frontend
pnpm --filter admin test
pnpm --filter miniapp test
```

### Не запускать по умолчанию

- `./manage.sh smoke-staging` — полный E2E (тяжёлый)
- `RUN_E2E=1` в quality_gate — Playwright E2E
- Параллельные тяжёлые тесты

### Ручной E2E (когда нужно)

```bash
./manage.sh up-core
pnpm dev:admin &
# В другом терминале:
cd apps/admin-web && pnpm exec playwright test
```

---

## 10. Local-to-VPS Workflow

```
[Local]                    [GitHub]                 [VPS]
  │                           │                       │
  │  git add, commit           │                       │
  │  git push origin beta-release                      │
  │  ─────────────────────────>                       │
  │                           │  webhook / CI          │
  │                           │  ─────────────────────>
  │                           │                       │  pull, deploy
  │                           │                       │  (runtime only)
```

### Рекомендуемый flow

1. Разработка локально.
2. `git add -A && git status && git diff --stat`
3. `git commit -m "feat: ..."`
4. `git push origin beta-release`
5. VPS: webhook/CI делает pull и deploy (VPS — только runtime).

**Data sync:** [local-first-data-sync.md](local-first-data-sync.md)  
**Mode switching:** [local-dev-modes.md](local-dev-modes.md) — local full-stack, frontend+beta API, beta deployed
6. VPS не используется как IDE или основная dev-машина.

---

## Quick Reference

| Задача | Команда |
|--------|---------|
| Поднять core | `./manage.sh up-core` |
| Остановить core | `./manage.sh down-core` |
| Проверка качества | `./manage.sh check` |
| Полная проверка | `./manage.sh verify` |
| Admin dev | `pnpm dev:admin` |
| Miniapp dev | `pnpm dev:miniapp` |
| Backend тесты | `cd apps/admin-api && .venv/bin/python -m pytest tests/ -v` |
