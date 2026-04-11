---
date: 2026-04-11
task: Living project map audit
files_changed:
  - vault/01-specs/project-map.md
  - vault/06-reference/stack.md
  - vault/01-specs/module-graph.md
  - vault/_meta/AGENTS.md
---

## Summary

Scanned the repo via `fs_list` at the root (full recursive MCP listing hit output size limits), then used targeted `fs_read` on task-listed manifests and `find` counts excluding `node_modules` and `.venv`. Wrote `project-map.md`, `stack.md`, and `module-graph.md` with overview, tables, and a Mermaid graph; created `vault/_meta/AGENTS.md` with wikilinks to those notes. No application source files were modified.

