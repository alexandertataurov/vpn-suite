---
date: 2026-04-11
task: Bootstrap MCP servers
files_changed:
  - vault/05-journal/2026-04-11-bootstrap-mcp-servers.md
---

## Summary

`npm install` in `mcp-servers/` completed successfully (including `prepare` → `tsc` build, 0 vulnerabilities). Both servers already contained `console.error("MCP server listening on stdio")` after `server.connect`; local checks with `timeout 3s` using ts-node ESM and compiled `dist/*.js` all printed that line on stderr with no stack traces (Node printed unrelated `fs.Stats` deprecation warnings). `mcp-servers/.env` was already present with `VAULT_PATH=/home/alex/projects/vpn/vault` and `PROJECT_PATH=/home/alex/projects/vpn`; edit those if your machine layout differs. MCP smoke tests: `vault_list` returned vault paths under `04-tasks/`; `fs_list` at repo root listed `package.json` and `pnpm-lock.yaml`. No further follow-ups required for this bootstrap.
