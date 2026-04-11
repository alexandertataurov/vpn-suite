# Local-First Development — Data Sync from VPS

Архитектура и workflow для разработки с локальным кодом и реалистичными данными из VPS.

---

## 1. Recommended Architecture

### Local-first принципы

| Принцип | Описание |
|---------|----------|
| Код локально | Все изменения в IDE, git — на локальной машине |
| Сервисы локально | postgres, redis, admin-api, bot — в Docker на localhost |
| Данные — snapshot | Копия prod/beta БД, не live connection |
| VPS — runtime only | Деплой, staging; не IDE, не dev DB |

### Почему нельзя разрабатывать напрямую на VPS DB

- **Риск потери данных** — миграции, тесты, скрипты могут сломать prod
- **Latency** — каждый запрос через сеть
- **Блокировки** — long-running queries блокируют prod
- **Секреты** — prod credentials не должны быть на dev-машине
- **Изоляция** — эксперименты не должны влиять на пользователей

### Когда допустим read-only доступ к VPS

- **pg_dump** — единственный безопасный способ: dump на VPS, скачать файл
- **Логи** — чтение логов для отладки (через SSH или log aggregation)
- **Метрики** — Prometheus/Grafana read-only

**Не допустимо:** прямое подключение приложения к prod DB, `psql` к prod для разработки.

---

## 2. Data Sync Strategy

### Схема потока

```
[VPS]                    [Local]
  │                         │
  │  ssh deploy@vps         │
  │  cd /opt/vpn-suite       │
  │  ./manage.sh backup-db   │
  │  → backups/postgres/    │
  │  pgdump_*.dump           │
  │                         │
  │  scp deploy@vps:...     │
  │  ──────────────────────>│  snapshots/
  │                         │
  │                         │  ./infra/scripts/runtime/restore-db-local.sh
  │                         │  ./infra/scripts/runtime/sanitize-local-db.sh
  │                         │  ./manage.sh up-core
```

### Шаги

1. **Dump на VPS** — `./manage.sh backup-db` (уже есть в `ops/db_dump.sh`)
2. **Скачать** — `scp deploy@VPS_HOST:/opt/vpn-suite/backups/postgres/pgdump_*.dump ./snapshots/`
3. **Восстановить локально** — `./manage.sh restore-db --force snapshots/pgdump_*.dump`
4. **Санитизация** — сброс паролей, очистка TOTP, отключение интеграций
5. **Запуск** — `./manage.sh up-core`

### Регулярное обновление snapshot

- Вручную по необходимости (раз в день/неделю)
- Или cron на VPS: backup → rsync/scp в локальную папку (опционально)

---

## 3. Safety Layer

### Данные для sanitize после restore

| Таблица/поле | Действие | Причина |
|--------------|----------|---------|
| `admin_users.password_hash` | Перезаписать через `seed_admin` | Prod пароль не должен быть в локалке |
| `admin_users.totp_secret` | `UPDATE ... SET totp_secret = NULL` | TOTP привязан к prod |
| `issued_configs` | Оставить (encrypted с prod SECRET_KEY) | Не расшифруются локально; download не сработает |
| `one_time_download_tokens` | Оставить | Токены не сработают без prod SECRET_KEY |

### Секреты — не переносить

| Секрет | Локально |
|--------|----------|
| `SECRET_KEY` | Свой локальный (≠ prod) |
| `POSTGRES_PASSWORD` | Локальный |
| `ADMIN_PASSWORD` | Локальный (из .env) |
| `BOT_TOKEN` / `TELEGRAM_BOT_TOKEN` | Пустой или stub |
| `TELEGRAM_STARS_WEBHOOK_SECRET` | Пустой |
| `AGENT_SHARED_TOKEN` | Пустой (если не тестируешь agent) |

### Отключение интеграций в локалке

| Интеграция | Как отключить |
|------------|----------------|
| Telegram Bot | `BOT_TOKEN=`, `TELEGRAM_BOT_TOKEN=` |
| Telegram Stars | `TELEGRAM_STARS_WEBHOOK_SECRET=` |
| Sentry | `SENTRY_DSN=` или `VITE_SENTRY_DSN=` |
| PostHog | `VITE_POSTHOG_KEY=` |
| Agent API | `AGENT_SHARED_TOKEN=` |

### Защита от случайных запросов в prod

- **Нет prod credentials** в `.env` — только local/beta
- **ENVIRONMENT=development** — отключает `validate_production_secrets`, но не даёт расслабиться
- **Проверка перед restore** — скрипт спрашивает подтверждение, что dump — с beta, не prod

---

## 4. Local Env Design

### Сервисы

| Сервис | По умолчанию | Когда поднимать |
|--------|--------------|------------------|
| postgres, redis | ✓ | Всегда для core |
| admin-api, admin-worker | ✓ | Core |
| reverse-proxy, telegram-vpn-bot | ✓ | Core |
| node-agent | ✗ | Только при тесте agent |
| monitoring (Prometheus, Grafana, Loki) | ✗ | По необходимости |
| audit stack | ✗ | Не для локальной разработки |

### Env файлы

| Файл | Назначение |
|------|------------|
| `.env` | Основной (gitignore) |
| `.env.example` | Шаблон |
| `.env.local` | Локальные переопределения (опционально, gitignore) |

### Разделение env по окружениям

```bash
# .env.local (переопределяет .env)
ENVIRONMENT=development
PUBLIC_DOMAIN=localhost
SECRET_KEY=local-dev-secret-key-min-32-chars
ADMIN_PASSWORD=admin-password-12
BOT_TOKEN=
TELEGRAM_BOT_TOKEN=
TELEGRAM_STARS_WEBHOOK_SECRET=
AGENT_SHARED_TOKEN=
```

Использование: `set -a && source .env.local && set +a` перед `docker compose`, или объединить в один `.env` для локалки.

---

## 5. Scripts and Commands

### Точные команды

```bash
# 1. Dump на VPS (выполнить на VPS или через SSH)
ssh deploy@VPS_HOST "cd /opt/vpn-suite && ./manage.sh backup-db"

# 2. Скачать dump локально
mkdir -p snapshots
scp deploy@VPS_HOST:/opt/vpn-suite/backups/postgres/pgdump_*.dump ./snapshots/

# 3. Восстановить в локальную postgres (core должен быть up)
./manage.sh up-core   # если ещё не запущен
./manage.sh restore-db --force snapshots/pgdump_20250317T120000Z.dump

# 4. Санитизация (см. скрипт ниже)
./infra/scripts/runtime/sanitize-local-db.sh

# 5. Перезапустить admin-api чтобы применить local .env
docker compose restart admin-api
```

### Suggested Shell Scripts

| Скрипт | Назначение |
|--------|------------|
| `infra/scripts/runtime/dump-db-from-vps.sh` | Dump на VPS + scp в `snapshots/` |
| `infra/scripts/runtime/restore-db-local.sh` | Restore dump в локальный postgres |
| `infra/scripts/runtime/sanitize-local-db.sh` | Сброс admin password, очистка TOTP |
| `infra/scripts/runtime/refresh-local-from-vps.sh` | Полный цикл: dump → download → restore → sanitize |

```bash
# Пример
export VPS_HOST=deploy@vpn.example.com
./infra/scripts/runtime/refresh-local-from-vps.sh
```

---

## 6. Workflow

### Daily workflow

1. **Утро / начало работы**
   - `./manage.sh up-core`
   - При необходимости: `./infra/scripts/runtime/refresh-local-from-vps.sh`

2. **Разработка**
   - Редактирование кода локально
   - Тесты: `./manage.sh check`, `cd apps/admin-api && pytest tests/`
   - Ручная проверка в браузере: `http://localhost/admin`

3. **Refresh данных** (по необходимости)
   - Когда нужны свежие данные с beta: `./infra/scripts/runtime/refresh-local-from-vps.sh`

4. **Перед commit**
   - `git status && git diff --stat`
   - `./manage.sh check`

5. **Push и deploy**
   - `git push origin beta-release`
   - CI / webhook деплоит на VPS

---

## 7. Safety Notes

- **Никогда** не копировать `.env` с VPS в локалку — там prod секреты
- **Проверять** источник dump: beta/staging, не prod
- **Не коммитить** `snapshots/` — добавь в `.gitignore`
- **Redis** не восстанавливать с VPS — сессии, rate limits не нужны для dev
- **Первый restore** — убедиться что локальный postgres пустой или можно перезаписать
