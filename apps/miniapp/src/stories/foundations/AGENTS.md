# Foundations (Storybook)

- **`overview/`** — `Overview.mdx` (`Foundations/Overview`).
- **`<topic>/`** — one folder per foundation (e.g. `color/`, `spacing/`): co-located `*.stories.tsx` + `*.mdx` where docs exist. In MDX use `<Meta title="Foundations/Topic" />` (same string as CSF `meta.title`). Do **not** use `<Meta of={importedCsf} />` for co-located files — the indexer often cannot resolve sibling CSF paths; `<Story id="…" />` still works.
- **`shared/`** — `foundationShared.tsx` (token previews, `FoundationSection`), `components/` (`DoDont`, `FoundationLinks`, …), and topic-specific CSS (`motionFoundationDemo.css`, `iconsFoundation.css`).
- **`presentation/`** — `foundationStories.css`: canvas chrome aligned with `src/stories/docs/presentation/storybookDocsBlocks.css` (loaded via `foundationShared.tsx`).
