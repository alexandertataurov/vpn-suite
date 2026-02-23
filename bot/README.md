# VPN Suite Bot

Telegram bot for VPN subscription and device management.

## Running tests

From the bot/ directory:

- All tests: `pytest`
- With coverage: `pytest --cov=. --cov-report=html`
- One file: `pytest tests/test_handlers.py -v`

Requirements: pytest, pytest-asyncio, pytest-cov, pytest-mock (see requirements.txt).
