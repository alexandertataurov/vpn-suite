# План доведения бота до production

## Текущее состояние (аудит)

- **Готово**: Start, Connect, Subscription/Payment, Devices, Status, Settings, Support menu, Troubleshooter, Fallback, nav/act/dev/pay callbacks.
- **Заглушки**: Report (только event), Receipts, Usage, Security (logout/reset configs).
- **Несогласованности**: Promo без выбора плана после кода; часть текстов без i18n; ответы без клавиатуры.

---

## Чек-лист production

### 1. Клавиатура после ответов (обязательно) — DONE
- [x] `/support` и `act:talk_support` — добавлен error_nav_markup().
- [x] `/status` и `act:service_status` — добавлен error_nav_markup().
- [x] `help:support` — добавлен error_nav_markup().
- [x] `revenue:see_servers` — при "No servers" и после списка добавлена клавиатура.

### 2. i18n (обязательно) — DONE
- [x] nav.py: pay_title, pay_choose_method, back.
- [x] menu_actions: stub_*, ts_*, reissue_pick_device, promo_send_hint.
- [x] devices: btn_config, btn_reissue, btn_remove, btn_refresh_list.
- [x] tariffs: promo_invalid, promo_accepted.
- [x] trial: no_servers, servers_list, loading_moment.

### 3. Promo — DONE (вариант B)
- [x] Тексты в i18n (promo_invalid, promo_accepted, promo_send_hint); после ошибки/успеха — клавиатура [Home].

### 4. Report problem — DONE (вариант B)
- [x] stub_report_sent в i18n; event support_report_sent без сбора текста от пользователя.

### 5. Security / Receipts / Usage — DONE
- [x] stub_logout, stub_reset_configs, stub_receipts, stub_usage, stub_faq в i18n.

### 6. Документация — DONE
- [x] [bot-menu-architecture.md](bot-menu-architecture.md) обновлён: inline меню, nav:*/act:*/dev:*.

### 7. Мёртвый код — DONE
- [x] extra_commands.py удалён (дублировал /status, /devices и т.д.).

### 8. Тесты
- [x] Добавлены тесты: nav:home, nav pay_methods, fallback, render_menu, act:faq, cmd_status/support с клавиатурой.
- [x] Запуск: `docker build -f apps/telegram-bot/Dockerfile.test -t vpn-bot-test . && docker run --rm vpn-bot-test` (из корня репо).

---

## Порядок выполнения

1. Клавиатуры после support/status/help/trial (быстро).
2. i18n для всех захардкоженных строк.
3. Promo: либо план после кода, либо i18n + описание.
4. Report: либо FSM + отправка, либо i18n заглушки.
5. Security/Receipts/Usage — i18n заглушки.
6. Обновить [bot-menu-architecture.md](bot-menu-architecture.md).
7. extra_commands: решение (подключить/удалить).
8. Report FSM: при необходимости — FSM сбор текста от пользователя и отправка в канал/бэкенд; сейчас достаточно event + i18n-сообщение.
