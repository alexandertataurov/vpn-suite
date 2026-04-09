# Miniapp design system

Design system docs have moved to **[../../docs/design-system/](../../docs/design-system/)**.

- Entry point and layer map: [../../docs/design-system/README.md](../../docs/design-system/README.md)
- Architecture: [../../docs/design-system/architecture.md](../../docs/design-system/architecture.md)
- Enforcement checklist: [../../docs/design-system/enforcement-checklist.md](../../docs/design-system/enforcement-checklist.md)
- Mobile guidelines: [../../docs/design-system/mobile-platform-guidelines.md](../../docs/design-system/mobile-platform-guidelines.md)

Import reusable UI from `@/design-system`. Code lives in this folder (`tokens/`, `theme/`, `primitives/`, `components/`, `patterns/`, `recipes/`, `layouts/`, `styles/`).

**Icons**: Import from `@/design-system/icons` for better tree-shaking (e.g. `import { IconShield } from "@/design-system/icons"`).

Route-owned presentation does not live here anymore. App-layer page families such as onboarding and page-specific route polish live under [`src/styles/app/`](/home/alex/projects/vpn/apps/miniapp/src/styles/app/index.css) and must not add ancestor-driven selectors back into `design-system/styles/`.
