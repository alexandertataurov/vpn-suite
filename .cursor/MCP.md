# MCP configuration

- **postgres** and **redis**: Connection strings in `mcp.json` must point at **localhost only** (local dev). Never use staging or production.
- **github**: Replace `<YOUR_GITHUB_PAT>` with a PAT (github.com/settings/tokens, `repo` scope). Use `read` only unless you want AI-assisted PR creation.
- **git**: Requires `uv` installed (`pip install uv` or `brew install uv`).

## Consider later (enable when ready)

- **puppeteer** — `@modelcontextprotocol/server-puppeteer`: browser automation for E2E; requires Chrome. Set `"disabled": false` and add to `mcpServers` if needed.
- **sentry** — read crash reports; requires Sentry account + DSN.
- **linear** — read/write Linear issues; requires Linear API key.
