# Miniapp Storybook — file placement

All Storybook story modules (`.stories.tsx`) for this app live under **`src/stories/`** only.

- **`src/stories/pages/`** — page-level contract/sandbox stories (`Pages/Contracts/*`, etc.). **Do not** copy the same files under `src/stories/design-system/stories/pages/` — Storybook will report duplicate story IDs.
- **`src/stories/design-system/`** — mirrors `src/design-system/` (same subpaths). Stories import implementation via `@/design-system/...`, never co-located `from "."` next to components.
- **`src/stories/foundations/`** — foundations showcases and MDX companions. Layout: `overview/`, one folder per topic (`color/`, `spacing/`, …), plus `shared/` (stories primitives + doc components) and `presentation/` (`foundationStories.css`).
- **`src/stories/docs/`** — Storybook docs shell (`DocsPage`, `ThemedDocsContainer`, `docs.css`, manager/docs theme, and docs helper blocks under `components/`).
- **`src/stories/docs/presentation/`** — Doc* MDX blocks and `storybookDocsBlocks.css` (preview): **canvas** uses class `docs-pres-stories` on `StorybookMiniappShell` so story previews share the same `--ds-docs-max` / type baseline.
- **`src/stories/introduction/`** — introduction MDX only.

Do not add `*.stories.tsx` next to runtime components under `src/design-system/`, `src/pages/`, or elsewhere.

Story titles and taxonomy (`storybook:taxonomy`) are unchanged: `Foundations/*`, `Primitives/*`, `Components/*`, etc.
