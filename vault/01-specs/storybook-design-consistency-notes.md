---
type: reference
updated: 2026-04-11
---

# Storybook & design consistency — scope

| Area | App | Key commands (from repo root) |
|------|-----|--------------------------------|
| Storybook CI (miniapp) | `apps/miniapp` | `pnpm run storybook:ci:miniapp` |
| Storybook dev | admin | `pnpm run storybook:admin` (port 6006) |
| Storybook dev | miniapp | `pnpm run storybook:miniapp` (port 6007) |
| Design guardrails | miniapp | `pnpm run guardrails` → `design:check` |
| Token drift | miniapp | `pnpm --filter miniapp token:drift` |

Related vault tasks: **013** (miniapp Storybook CI), **014** (admin Storybook), **015** (design checks & tokens).
