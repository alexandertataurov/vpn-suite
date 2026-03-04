#!/usr/bin/env bash
# sessionStart hook: inject VPN Suite project context into new composer sessions.
# Reads JSON from stdin; outputs JSON with additional_context.
cat > /dev/null

CONTEXT="VPN Suite (this repo): Full-stack monorepo. Infra: Docker Compose, GitHub Actions CI, self-hosted staging. Backend: Python 3.12, FastAPI, SQLAlchemy async, Alembic, Redis, PostgreSQL (backend/). Frontend: React 18, TypeScript, Vite workspaces admin, miniapp, shared (frontend/). Bot: Python 3.12 + aiogram (bot/). Node-agent for VPN hosts (node-agent/). Ops: manage.sh, config/caddy, config/monitoring. Apply team-contract and .cursor/rules.md; use PROMPT.md workflow and domain subagents for cross-boundary work."

# Escape for JSON: backslash and double-quote
ESC=$(echo "$CONTEXT" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' ' ')
printf '{"additional_context":"%s","continue":true}\n' "$ESC"
