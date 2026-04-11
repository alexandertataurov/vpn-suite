---
type: guide
updated: 2026-04-11
---

# Obsidian conventions for `07-docs`

This vault’s documentation mirror lives under **`07-docs/`** (see [[07-docs/README]]). These rules keep notes useful in **Obsidian** (graph, backlinks, search) while allowing occasional sync back to repo `docs/` for GitHub.

## Wikilinks

- Prefer **vault-root paths** so links work from any note: `[[07-docs/guides/operations-guide|Operations guide]]`, not `[[guides/operations-guide]]` (ambiguous if multiple folders exist).
- Omit the **`.md`** extension in wikilinks (Obsidian default).
- **Anchors:** use `[[07-docs/api/overview#section-id|Overview]]` when the target has a stable heading slug. GitHub and Obsidian both use generated heading IDs for common cases; verify after large edits.
- **Aliases:** `[[07-docs/specs/README|Specs index]]` reads better than bare paths in prose.
- **Bidirectional strategy:** Automated passes may replace Markdown `[text](relative.md)` with wikilinks when the target file exists under `07-docs/`. **Repo-only paths** (`openapi/…`, `../apps/…`, absolute URLs) stay as Markdown links.

## Frontmatter

- Optional YAML at the top of heavy hubs or specs: `type`, `updated`, `tags` (e.g. `tags: [ops, runbook]`).
- Keep frontmatter **minimal** on mirrored pages unless the note is vault-native (conventions, MOCs).

## MOCs / hubs

- **`07-docs/README`** — primary human entry; role tables and quick reference.
- **`07-docs/_index`** — compact map-of-content (MOC) with wikilinks to major subtrees.
- Sub-areas may use local `README.md` as mini-hubs (api, specs, guides, observability, ops).

## Headings & structure

- One H1 per note (title); use H2/H3 for scanability.
- Stable heading text matters for `#anchor` links and Obsidian outline.

## Callouts

- Obsidian callouts use `> [!note] Title` blocks. Use sparingly in mirrored docs so GitHub rendering stays acceptable, or keep callouts **vault-only** in native notes.

## Naming

- File names mirror **`docs/`** (same relative paths). Do not rename casually—breaks sync and git history.

## What not to change (GitHub / sync)

- Do **not** turn into wikilinks: `http(s)://`, `mailto:`, repo paths outside `07-docs` (e.g. `openapi/openapi.yaml`, `apps/…`).
- If you **sync vault → `docs/`** for PRs, wikilinks will **not** render on GitHub. Options: (1) maintain vault as Obsidian-primary and accept drift; (2) run a reverse transform for PRs; (3) keep dual links (verbose). Default here: **vault-primary for `07-docs`**.

## Related

- [[01-specs/vpn-suite-tech-spec-updated]] — Updated tech spec (canonical vault copy; path notes for §6.1).
- [[07-docs/_index]] — MOC
- [[07-docs/README]] — full hub
