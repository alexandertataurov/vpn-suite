# Релиз бота Vega VPN

## Чек-лист перед релизом

- [x] Все ответы с клавиатурой (Home/Back) где нужно: support, status, help, trial, promo, report, devices, tariffs errors.
- [x] i18n: ключи для всех пользовательских строк (ru/en); заглушки (receipts, usage, FAQ, security, report).
- [x] Навигация: inline меню (nav:*, act:*, dev:*, pay:*), fallback для неизвестных callback.
- [x] Мёртвый код: extra_commands.py удалён (дублировал /status, /devices и т.д.).
- [ ] Переменные окружения: BOT_TOKEN, BOT_USERNAME, PANEL_URL, SUPPORT_HANDLE или SUPPORT_LINK; опционально REDIS_URL, INSTALL_GUIDE_URL.
- [ ] Тесты: `docker build -f bot/Dockerfile.test -t vpn-bot-test . && docker run --rm vpn-bot-test`

## Оплата и синхронизация с сервером

- При получении `successful_payment` от Telegram бот вызывает **POST /api/v1/bot/payments/telegram-stars-confirm** (invoice_payload, tg_id, telegram_payment_charge_id, total_amount). Бэкенд помечает платёж выполненным и продлевает подписку (idempotent).
- Бот отправляет событие **payment_completed** в `/api/v1/bot/events` для воронки и аналитики.
- Метрики: `bot_payment_confirm_total{status="ok|fail"}`, `bot_events_total{event_type="..."}`, `bot_payment_success_total`.

## Версия

Релизная версия для production: все основные сценарии (старт, подключение, тарифы, оплата Stars с синхронизацией, устройства, поддержка, troubleshooting) работают. Заглушки: Receipts, Usage, FAQ (краткий текст), Security (logout/reset configs), Report (только event + сообщение).

## Сборка и запуск

```bash
# Из корня репо
docker compose build telegram-vpn-bot
docker compose up -d telegram-vpn-bot
```

См. также `manage.sh up-core` для полного поднятия стека.
