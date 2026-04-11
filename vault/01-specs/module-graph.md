---
type: module-graph
updated: 2026-04-11
---

# Module dependency graph

```mermaid
graph TD
  subgraph frontend["pnpm workspace"]
    admin-web["apps/admin-web"]
    miniapp["apps/miniapp"]
    shared-web["apps/shared-web"]
    admin-web --> shared-web
    miniapp --> shared-web
  end

  subgraph control["Control plane"]
    admin-api["apps/admin-api"]
    worker["admin-worker"]
    postgres[(PostgreSQL)]
    redis[(Redis)]
    admin-api --> postgres
    admin-api --> redis
    worker --> postgres
    worker --> redis
  end

  subgraph edge["Edge"]
    caddy["reverse-proxy Caddy"]
    bot["telegram-vpn-bot"]
    agent["node-agent"]
  end

  caddy --> admin-api
  bot --> admin-api
  agent -->|"mTLS /agent"| admin-api

  subgraph tooling["Dev-only"]
    mcp["mcp-servers"]
  end
```

## Notes

- **Runtime vs build:** `shared-web` is a compile-time dependency of both frontends; there is no runtime HTTP coupling between SPA and shared package beyond bundled JS.
- **Bot → API:** HTTP to internal `admin-api:8000` (`PANEL_URL`), plus Telegram servers; not direct DB access.
- **node-agent → API:** Outbound HTTPS with client certs; Docker socket is local-only.
- **admin-api ↔ Docker:** API and worker mount `docker.sock` for WG/container operations in supported modes.
- **Circular imports:** Python `app/models` uses forward refs; Ruff/Mypy overrides in `pyproject.toml` — not shown in graph.
- **Optional compose profiles:** Monitoring, `agent`, `docker-telemetry` change which boxes run together.

