# `src/utils` — Miniapp-Local Utilities

Build-time or alias targets used by the miniapp. **Do not** add feature logic here.

## Alias Target: `tailwindMergeLite`

The file `tailwindMergeLite.ts` is wired as a **Vite/Vitest alias** for `tailwind-merge`:

- `vite.config.ts` (resolve.alias) and `vitest.config.ts` map `tailwind-merge` → `./src/utils/tailwindMergeLite.ts`
- No direct imports from `@/utils` — code imports `tailwind-merge` or uses `cn()` from shared
- `cn()` (shared) → `twMerge` (alias) → this file

### Purpose

Lightweight replacement for `tailwind-merge`. Filters falsy class values and joins strings. **Does not** resolve Tailwind utility conflicts (e.g. `p-2` + `p-4` → `p-4`). Use only with semantic classes (`.btn-primary`, `.ds-box`, etc.).

### Why

Miniapp uses plain CSS and semantic classes, not Tailwind utilities. Real `tailwind-merge` adds ~2–3KB with no benefit here. This alias saves bundle size.

### Discovery

To find where `twMerge` is implemented: check `vite.config.ts` and `vitest.config.ts` for the `tailwind-merge` alias.
