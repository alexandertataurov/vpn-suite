# Miniapp design system (code)

Implementation lives in `src/design-system/`. **Architecture, enforcement, content library, audit artifacts, and theme runtime** are documented in the repository root:

- [docs/frontend/miniapp-design-system/README.md](../../../../docs/frontend/miniapp-design-system/README.md)

## Notes co-located with this app

- [styles.md](styles.md) — CSS load order and style layers
- [components.md](components.md) — component groups and export order
- [primitives.md](primitives.md) — primitive layout/typography
- [foundations-changelog.md](foundations-changelog.md) — foundations/token CI changelog
- [storybook-audit.md](storybook-audit.md) — current Storybook inventory and gap analysis
- [responsive-matrix.md](responsive-matrix.md) — breakpoint behavior matrix for key surfaces
- [token-architecture.md](token-architecture.md) — semantic token and theme guidance
- [component-api-style-guide.md](component-api-style-guide.md) — prop naming and composition rules
- [cta-optimization-guide.md](cta-optimization-guide.md) — conversion-focused CTA guidance
- [engagement-pattern-library.md](engagement-pattern-library.md) — empty/loading/success/error patterns
- [implementation-roadmap.md](implementation-roadmap.md) — prioritized next steps

Audit regeneration:

- `pnpm --filter miniapp storybook:audit` — prints the current Storybook inventory and page-contract coverage from `src/stories/`
- `pnpm --filter miniapp run test:responsive:audit` — runs the viewport audit matrix and writes `test-results/responsive-audit/ledger.md`

**Icons**: Import from `@/design-system/icons` for tree-shaking (e.g. `import { IconShield } from "@/design-system/icons"`).

Route-owned presentation does not live in the design-system package tree. App-layer page families live under `src/styles/app/` and must not add ancestor-driven selectors back into `design-system/styles/`.
