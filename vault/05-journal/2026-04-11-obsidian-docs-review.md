---
date: 2026-04-11
task: Obsidian docs review (07-docs)
files_changed:
  - vault/01-specs/obsidian-docs-conventions.md
  - vault/07-docs/_index.md
  - vault/07-docs/README.md
  - vault/_meta/AGENTS.md
  - vault/07-docs/**/*.md (65 files: relative .md links → vault-root wikilinks)
  - vault/04-tasks/active/004-obsidian-docs-review.md (files[] + _index path)
---

## Summary

Added [[01-specs/obsidian-docs-conventions]] (wikilinks, frontmatter, MOCs, callouts, naming, GitHub sync caveats) and [[07-docs/_index]] as a compact MOC. Ran an automated pass on `vault/07-docs/**/*.md` converting **390** resolvable relative Markdown links to vault-root `[[07-docs/...|…]]` wikilinks across **65** files; left `http(s):`, `openapi/`, and out-of-tree paths unchanged. Tightened the docs hub blockquote (MOC + conventions links) and persona table labels in [[07-docs/README]]. Updated [[_meta/AGENTS]] to reference the conventions note and MOC.

