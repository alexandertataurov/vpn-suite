#!/usr/bin/env bash
set -euo pipefail

VAULT_ROOT="${1:-.}/vault"

mkdir -p \
  "${VAULT_ROOT}/00-inbox" \
  "${VAULT_ROOT}/01-specs" \
  "${VAULT_ROOT}/02-adr" \
  "${VAULT_ROOT}/03-prompts/agents" \
  "${VAULT_ROOT}/03-prompts/templates" \
  "${VAULT_ROOT}/04-tasks/active" \
  "${VAULT_ROOT}/04-tasks/done" \
  "${VAULT_ROOT}/05-journal" \
  "${VAULT_ROOT}/06-reference" \
  "${VAULT_ROOT}/_meta"

cat > "${VAULT_ROOT}/00-inbox/capture.md" <<'EOF'
---
type: inbox
captured: YYYY-MM-DD
processed: false
tags: []
source: ""
---

# Title

EOF

cat > "${VAULT_ROOT}/01-specs/feature-spec-template.md" <<'EOF'
---
type: spec
status: draft
priority: medium
owners: []
tags: []
related_adr: []
---

# Feature

## Problem

## User stories

## Non-goals

## API / contracts

## Open questions

EOF

cat > "${VAULT_ROOT}/02-adr/0001-template.md" <<'EOF'
---
type: adr
status: proposed
date: YYYY-MM-DD
deciders: []
supersedes: null
superseded_by: null
tags: []
---

# ADR 0001: Title

## Context

## Decision

## Consequences

## Alternatives considered

EOF

cat > "${VAULT_ROOT}/03-prompts/README.md" <<'EOF'
---
type: prompts-index
version: 1
tags: []
---

# Prompts

- `agents/` — role-specific system prompts
- `templates/` — reusable templates with `{{placeholders}}`

EOF

cat > "${VAULT_ROOT}/03-prompts/agents/qa.md" <<'EOF'
---
type: prompt-agent
role: qa
version: 1
tags: []
---

# QA agent

## System prompt

You are a senior QA engineer for a Telegram Mini App VPN product (FastAPI, React/Vite, aiogram, WireGuard/AmneziaWG).

## Task

EOF

cat > "${VAULT_ROOT}/03-prompts/agents/devops.md" <<'EOF'
---
type: prompt-agent
role: devops
version: 1
tags: []
---

# DevOps agent

## System prompt

You are a senior DevOps engineer for a Telegram Mini App VPN product (Docker Compose, observability, CI/CD).

## Task

EOF

cat > "${VAULT_ROOT}/03-prompts/agents/ui.md" <<'EOF'
---
type: prompt-agent
role: ui
version: 1
tags: []
---

# UI agent

## System prompt

You are a senior frontend engineer for a Telegram Mini App (React, Vite, design tokens, accessibility).

## Task

EOF

cat > "${VAULT_ROOT}/03-prompts/agents/backend.md" <<'EOF'
---
type: prompt-agent
role: backend
version: 1
tags: []
---

# Backend agent

## System prompt

You are a senior backend engineer for a VPN control plane (FastAPI, Postgres, Alembic, Redis).

## Task

EOF

cat > "${VAULT_ROOT}/03-prompts/templates/task-template.md" <<'EOF'
---
type: prompt-template
name: generic-task
version: 1
tags: []
---

# Prompt template

Role: {{role}}

Goal: {{goal}}

Context:
{{context}}

Constraints:
{{constraints}}

Deliverables:
{{deliverables}}

EOF

cat > "${VAULT_ROOT}/04-tasks/active/TASK-0001-example.md" <<'EOF'
---
status: todo
agent: cursor
files: []
depends: []
---

## Goal

## Context

## Acceptance criteria

## Prompt (copy-paste to agent)

EOF

cat > "${VAULT_ROOT}/04-tasks/done/.gitkeep" <<'EOF'

EOF

cat > "${VAULT_ROOT}/05-journal/dev-log-template.md" <<'EOF'
---
type: journal
date: YYYY-MM-DD
tags: []
---

# Dev log

## Done

## Decisions

## Retro / lessons

EOF

cat > "${VAULT_ROOT}/06-reference/stack-cheatsheet.md" <<'EOF'
---
type: reference
topic: stack
last_reviewed: YYYY-MM-DD
tags: []
---

# Stack reference

## FastAPI

## React / Vite

## aiogram

## WireGuard / AmneziaWG

EOF

cat > "${VAULT_ROOT}/_meta/AGENTS.md" <<'EOF'
---
type: meta
version: 1
---

# Vault agents

Document team conventions for AI assistants: boundaries, repos, env files, and review checklist.

EOF

cat > "${VAULT_ROOT}/_meta/vault.yaml" <<'EOF'
vault_name: vpn-product
default_date_format: YYYY-MM-DD
task_schema: 04-tasks
inbox: 00-inbox
EOF

cat > "${VAULT_ROOT}/_meta/mcp.json" <<'EOF'
{
  "mcpServers": {}
}

EOF
