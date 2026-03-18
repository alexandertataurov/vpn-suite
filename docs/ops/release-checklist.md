# Release checklist — VPN Suite

Перед тегом/релизом выполнить по порядку. Все пункты должны быть зелёными.  
**Для v0.1.0-rc.1:** версия в `main.py` (API_VERSION), CHANGELOG, NODE_MODE в /health, E2E в CI.

---

## 1. Код и тесты

- [ ] `cd backend && ruff check .` — без ошибок
- [ ] `cd backend && ruff format --check .` — без изменений
- [ ] `cd backend && pytest tests/ -v` — все проходят (e2e/webhook без DB могут быть skipped)
- [ ] Нет секретов в коде; пароли/ключи только в `.env` (redaction в логах)

## 2. Среда и секреты (production)

- [ ] `ENVIRONMENT=production` в `.env` на сервере
- [ ] `SECRET_KEY` — уникальный, ≥32 символов (`openssl rand -base64 32`)
- [ ] `ADMIN_PASSWORD` — не дефолт
- [ ] `POSTGRES_PASSWORD` — сильный пароль
- [ ] `AGENT_SHARED_TOKEN` — уникальный (и совпадает с node env)
- [ ] `GRAFANA_ADMIN_PASSWORD` — не дефолт
- [ ] `ALERTMANAGER_IMAGE` задан (без `latest`)
- [ ] `BAN_CONFIRM_TOKEN`, `REVOKE_CONFIRM_TOKEN`, `BLOCK_CONFIRM_TOKEN`, `RESTART_CONFIRM_TOKEN` — заданы нестандартные значения (иначе старт с ENVIRONMENT=production упадёт)
- [ ] Telegram Stars: `TELEGRAM_STARS_WEBHOOK_SECRET` задан; webhook проверяет заголовок
- [ ] **Secrets on disk:** Не коммитить `.env` и `secrets/` (node `secrets/node.env` с `AGENT_SHARED_TOKEN` — отдельно). На хосте: `chmod 600` для `.env` и файлов в `secrets/`. Единственный источник конфига — `.env`.

## 2.1. Telegram Bot (production)

- [ ] `BOT_TOKEN`, `BOT_API_KEY` заданы в `.env` сервиса bot
- [ ] `BOT_USERNAME` задан (без @) — иначе реферальные ссылки не работают
- [ ] `SUPPORT_HANDLE` задан для бота
- [ ] Webhook: `BOT_WEBHOOK_URL` и `BOT_WEBHOOK_PATH` заданы при использовании webhook‑режима
- [ ] Команды бота синхронизированы при старте (`set_my_commands`); при необходимости обновить список в `bot/commands.py`

## 3. Инфраструктура

- [ ] `./manage.sh config-validate` — конфиг валиден
- [ ] `./manage.sh up-core` — все сервисы healthy (admin-api, postgres, redis, reverse-proxy, bot)
- [ ] `GET /health` → 200, `GET /health/ready` → 200 при работающих DB/Redis
- [ ] Postgres/Redis не проброшены на host (только внутренняя сеть)
- [ ] Доступ к панели только по HTTPS (Caddy); CORS без `*`

## 4. Деплой

- [ ] `./manage.sh build-admin` выполнен перед up-core (иначе /admin/assets/* 404)
- [ ] `./manage.sh seed` выполнен при первом деплое (админ из ADMIN_EMAIL/ADMIN_PASSWORD)
- [ ] **Plans:** создан хотя бы один тариф (Plans) для бота и miniapp через Admin UI (Billing / Plans)
- [ ] **Production (recommended):** `NODE_MODE=agent`, `NODE_DISCOVERY=agent`; ноды подключаются через `node-agent` (outbound-only) и mTLS на `https://$PUBLIC_DOMAIN:8443/api/v1/agent/*` (allowlist `AGENT_ALLOW_CIDRS`).
- [ ] Резервное копирование настроено по расписанию (см. `docs/ops/runbook.md`).

## 5. Функциональные упущения (известные)

| Область | Упущение | Критичность | Примечание |
|--------|----------|--------------|------------|
| Issue profile | Выдача конфига и runtime peer применяются в разные моменты | Средняя | **Production:** `NODE_MODE=agent` — control-plane пишет desired state в БД, node-agent применяет к awg runtime и шлёт heartbeat. Ответ issue содержит `node_mode` и `peer_created` (в agent mode может быть `false` на момент ответа). |
| Node mode | Режим ноды mock/real/agent | — | `NODE_MODE=mock` (по умолчанию). **Production:** рекомендуется `NODE_MODE=agent` (через node-agent). Режим `real` (docker exec) допустим только для single-host/dev и требует Docker runtime доступа в control-plane. |
| Monitoring UI | Нет отдельного UI для 7/30/90 дней метрик по нодам | Низкая | Prometheus + Grafana при наличии; админка показывает текущие stats. |
| CryptoPay | Только Telegram Stars; CryptoPay опционален | Низкая | Добавить провайдер по тому же контракту webhook. |
| Subscription status | В API возвращается `effective_status` из split-state lifecycle (`pending`, `active`, `paused`, `grace`, `blocked`, `cancelled`, `cancel_at_period_end`, `expired`) | — | Админка и бот используют effective_status для отображения; выдача/продление по-прежнему по canonical entitlement rules. |
| CI | Build выполняется из корня репо без `working-directory` | — | `docker compose build admin-api` корректен. |

### Контур runtime provisioning (для production)

Реализовано:
- `NODE_MODE=agent`: control-plane хранит desired state в БД, node-agent применяет к awg runtime и сообщает состояние через heartbeat.
- `NODE_MODE=real` (single-host/dev): control-plane выполняет peer-операции через `DockerNodeRuntimeAdapter` и WireGuard runtime команды (`docker exec <container> wg set ...`).

## 6. Идемпотентность и аудит

- [ ] Платежи: один `external_id` → один платёж; replay/concurrent → 200, без повторного списания
- [ ] Issue: один Idempotency-Key → один device; device_limit под нагрузкой не превышается (FOR UPDATE)
- [ ] Аудит: все мутации (servers, users, subscriptions, devices, plans, **payments/webhook**) пишутся в audit_logs

## 7. Фронтенд (Admin + Miniapp)

- [ ] `cd frontend && pnpm run build` — admin и miniapp собираются без ошибок
- [ ] Админка: Overview (Dashboard) загружает данные с `GET /api/v1/overview` (Bearer)
- [ ] Админка: User detail — вкладка Devices, кнопка «Issue device»
- [ ] Miniapp: нижние табы Status | Devices | Profile | Help
- [ ] Miniapp: Devices — «Add device» → выдача конфига, Copy / Amnezia link
- [ ] Miniapp: Checkout — после оплаты опрос `/webapp/me`, редирект при успехе

### Доступность и стили (см. docs/css-theming-styles-audit.md)

- [ ] Тема сохраняется между сессиями (localStorage); переключатель в Settings работает
- [ ] Контраст: основной текст и фон проходят WCAG AA; при изменении токенов — проверить muted/бордеры
- [ ] Фокус: у всех интерактивных элементов (кнопки, ссылки, поля, селекты) видимый focus-visible
- [ ] Уважение prefers-reduced-motion (уже в global.css)
- [ ] Основные CTA на мобильном ≥44px (lg кнопки, табы miniapp)
- [ ] Не использовать кнопку размера sm как единственный основной CTA на мобильном (см. css-architecture-audit.md)

## 8. Ручная проверка (рекомендуется)

- [ ] Логин в админку: POST `/api/v1/auth/login` → 200 + token
- [ ] GET `/api/v1/servers` с Bearer → 200
- [ ] GET `/api/v1/overview` с Bearer → 200, поля servers_total, users_total, subscriptions_active
- [ ] Webhook: два запроса с одним `external_id` → оба 200, одна запись payment
- [ ] Issue device с Idempotency-Key; повтор с тем же ключом → 200, один device
- [ ] Webapp: POST `/webapp/devices/issue` с Bearer сессии → 200/201, в ответе config, node_mode, peer_created (один раз)
- [ ] В ответах 4xx/5xx нет Traceback; в логах нет сырых паролей/токенов
- [ ] Bot: /start → выбор языка → меню; /status, /devices, /install, /help, /support работают; реферальная ссылка и Support используют BOT_USERNAME и SUPPORT_* из env

## 9. Staging / smoke (опционально)

Команды smoke для staging реализованы в `manage.sh` (используют `scripts/staging_full_validation.sh` и `scripts/staging_ha_failover_smoke.sh`).
Требования: поднят core stack, заданы `ADMIN_EMAIL`/`ADMIN_PASSWORD` (для E2E и authenticated smoke), доступны `amnezia-awg` и `amnezia-awg2` (для HA).

- [ ] CI (`.github/workflows/ci.yml`): lint, pytest, migrate, e2e — зелёный
- [ ] Локально: `./manage.sh config-validate && ./manage.sh up-core`, затем `curl -sf http://localhost:8000/health` и логин в админку
- [ ] `./manage.sh smoke-staging` — полный прогон (tests + build + Playwright + API smoke)
- [ ] `./manage.sh smoke-ha` — HA/failover smoke (pause/unpause узла и проверка scheduler)
- [ ] `./manage.sh smoke-staging-ha` — полный прогон + HA
- [ ] Workflow `staging-smoke-ha.yml` на self-hosted runner — запускает `smoke-staging-ha` или `smoke-ha`

---

**Go:** все пункты разделов 1–4, 6 и 7 отмечены; раздел 5 учтён. **No-Go:** любой критичный пункт не выполнен или секреты по умолчанию в prod.

---

## Команды для тега v0.1.0-rc.1 (release manager)

После выполнения разделов 1–4 и 6:
```bash
git tag v0.1.0-rc.1
git push origin v0.1.0-rc.1   # при необходимости
```
Post-tag: `git checkout v0.1.0-rc.1` → `docker compose build admin-api` → `./manage.sh up-core` → проверить `GET /health` (node_mode: mock) и логин.
