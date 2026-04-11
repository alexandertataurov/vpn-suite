---
status: done
agent: cursor
files:
  - vault/04-tasks/active/007-tech-spec-import-and-index.md
  - vault/01-specs/vpn-suite-tech-spec-updated.md
  - vault/_meta/AGENTS.md
  - vault/01-specs/obsidian-docs-conventions.md
depends: []
---

## Goal

Treat **`vault/01-specs/vpn-suite-tech-spec-updated.md`** as the canonical vault copy of the external **VPN Suite — Updated Tech Spec (2026-04-09)**. Add **index links** from vault meta and docs conventions so agents and humans can find it from [[_meta/AGENTS]] and [[01-specs/obsidian-docs-conventions]].

## Context

- Source was provided from Windows Downloads; repo copy is under `vault/01-specs/` with YAML frontmatter + path correction callout for §6.1.
- This task is **vault-only** (no `docs/` edit required).

## Acceptance criteria

1. **`vault/_meta/AGENTS.md`**: New bullet under Index or Specs pointing to `[[01-specs/vpn-suite-tech-spec-updated]]` with one-line description.
2. **`vault/01-specs/obsidian-docs-conventions.md`**: “Related” (or equivalent) section links to the tech spec note.
3. **Journal** `vault/05-journal/YYYY-MM-DD-tech-spec-import-index.md` with `files_changed`.
4. **`task_done`** this task path.

## Prompt (copy-paste to agent)

`task_next` → read `files[]` → edit AGENTS + conventions → journal → `task_done`.
