---
status: done
agent: cursor
files:
  - vault/01-specs/project-map.md
  - vault/06-reference/stack.md
  - vault/01-specs/module-graph.md
  - vault/_meta/AGENTS.md
  - README.md
  - AGENTS.md
  - package.json
  - pnpm-workspace.yaml
  - manage.sh
  - .env.example
  - mcp-servers/.env.example
  - apps/node-agent/.env.example
  - apps/admin-api/pyproject.toml
  - apps/admin-api/requirements.txt
  - apps/admin-api/requirements-dev.txt
  - apps/telegram-bot/requirements.txt
  - apps/telegram-bot/requirements-dev.txt
  - apps/node-agent/requirements.txt
  - apps/admin-web/package.json
  - apps/miniapp/package.json
  - apps/shared-web/package.json
  - mcp-servers/package.json
  - infra/compose/docker-compose.yml
depends: []
---

## Goal

Perform a codebase audit and write a **living project map** into the Obsidian vault: directory structure, entry points, modules, env vars (keys only), dependencies, and a Mermaid module graph. **Do not modify project source files** — only use `vault_write()` for the vault paths in `files` (and create `vault/_meta/AGENTS.md` if missing).

## Context

Prior session blocked on `task_next` returning null. This task enables an agent to run the full audit workflow under `.cursorrules`: call `task_next`, read every path in `files[]`, then implement. For paths not listed but required for discovery (routers, models, `config.*`), use **filesystem-mcp** `fs_list` / `fs_read` as read-only; if your workflow requires every read path in `files[]`, extend this note before running.

## Acceptance criteria

1. **`vault/01-specs/project-map.md`** — YAML frontmatter `type: project-map`, `updated: <date>`; sections: Overview, Directory structure, Entry points (table), Modules (H3 per app/top-level module), Environment variables (table), External dependencies (table), Open questions.
2. **`vault/06-reference/stack.md`** — `type: stack-reference`; Languages, Frameworks, Infrastructure, Dev tools, External services/APIs.
3. **`vault/01-specs/module-graph.md`** — `type: module-graph`; Mermaid `graph TD` of module→module dependencies; Notes for cycles/optional/runtime deps.
4. **`vault/_meta/AGENTS.md`** — Read existing content; append an **Index** section with `[[wikilink]]` links to the three notes above (create file with Index only if missing).
5. Final chat report: files scanned count (estimate if needed), module count, vault paths written, any unread paths/errors.

## Constraints

- First step: `fs_list` at project root (at least once) before deeper steps.
- If a directory has **>50** files, sample ~10 representative files instead of reading all.
- Env examples: list **variable keys only**, no values.
- Dependencies: extract from each `package.json` / `pyproject.toml` / `requirements*.txt` listed in `files` (and any others discovered for the tables).

## Prompt (copy-paste to agent)

Execute the living project map audit. Follow `.cursorrules`: `task_next` → read all `files[]` → `vault_write` only for vault deliverables → `vault_write` journal under `vault/05-journal/YYYY-MM-DD-living-project-map.md` → `task_done` with path `vault/04-tasks/active/002-living-project-map.md`. Use obsidian-mcp + filesystem-mcp; lint vault N/A. Use today’s date **2026-04-11** for frontmatter where applicable.
