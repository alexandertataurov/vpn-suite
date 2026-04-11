# Miniapp design system (code)

Implementation lives in `src/design-system/`. **Architecture, enforcement, content library, and theme runtime** are documented in the repository root:

- [docs/frontend/miniapp-design-system/README.md](../../../../docs/frontend/miniapp-design-system/README.md)

## Notes co-located with this app

- [styles.md](styles.md) — CSS load order and style layers
- [components.md](components.md) — component groups and export order
- [primitives.md](primitives.md) — primitive layout/typography
- [foundations-changelog.md](foundations-changelog.md) — foundations/token CI changelog

**Icons**: Import from `@/design-system/icons` for tree-shaking (e.g. `import { IconShield } from "@/design-system/icons"`).

Route-owned presentation does not live in the design-system package tree. App-layer page families live under `src/styles/app/` and must not add ancestor-driven selectors back into `design-system/styles/`.
