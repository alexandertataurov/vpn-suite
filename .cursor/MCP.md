# MCP configuration

- **postgres** and **redis**: Connection strings must point at **localhost only** (local dev). Start services with `./manage.sh up-core` before using.
- **github**: Set `GITHUB_PERSONAL_ACCESS_TOKEN` in env (github.com/settings/tokens, `repo` scope). Add to `.env` and source before launching Cursor.
- **context7**: Set `CONTEXT7_API_KEY` in env. Add to `.env` and source before launching Cursor.
- **git**: Uses `backend/.venv/bin/python`. Create venv if needed: `cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt -r requirements-dev.txt`.

## Consider later (enable when ready)

- **puppeteer** — `@modelcontextprotocol/server-puppeteer`: browser automation for E2E; requires Chrome. Set `"disabled": false` and add to `mcpServers` if needed.
- **sentry** — read crash reports; requires Sentry account + DSN.
- **linear** — read/write Linear issues; requires Linear API key.
