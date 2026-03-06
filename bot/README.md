# VPN Suite Bot

Telegram bot for VPN subscription and device management. The chat menu button shows **"Open App"** and opens the Mini App (Web App) when tapped.

## Config

- **MINIAPP_URL**: Mini App URL (HTTPS). Set to your public Mini App URL (e.g. `https://yourdomain.com/webapp`). Same as "MINI_APP_URL" in external docs. Required for the menu button and inline "Open App" button.

## How to verify (Menu Button "Open App")

1. **Config**: Set `MINIAPP_URL` to your Mini App HTTPS URL (e.g. `https://yourdomain.com/webapp`).
2. **BotFather**: In @BotFather → Bot Settings → Configure Mini App / Menu Button, set the Mini App URL to the same HTTPS URL so it does not conflict.
3. **Global default**: Restart the bot; open a **new** private chat with the bot. Confirm the menu button (next to the message input) shows **"Open App"** and opens the Mini App.
4. **Per-user refresh**: In a chat where the button might be cached, send `/start` and confirm the menu button updates to "Open App" and opens the Mini App.
5. **Clients**: Manually check on Android, iOS, and Desktop that the menu button shows "Open App" and launches the Mini App.

## Running tests

From the bot/ directory:

- All tests: `pytest`
- With coverage: `pytest --cov=. --cov-report=html`
- One file: `pytest tests/test_handlers.py -v`

Requirements: pytest, pytest-asyncio, pytest-cov, pytest-mock (see requirements.txt).
