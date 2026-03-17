# UI Inconsistencies Audit

## Checks Performed

| Check | Location | Status |
|-------|----------|--------|
| Spacing/typography | shared/src/ui/styles | Tokens in tokens.css; typography.css |
| Table alignment/overflow | shared/src/ui/table, cellUtils | CellUtils, TableContainer |
| Button/icon sizes | design-system/components/Button/ | Button sizes: sm, md, lg, icon |
| Z-index | shared/src/theme/z-index.ts | modal, drawer, dropdown, toast |
| Dark mode | ThemeProvider, localStorage vpn-suite-theme | Supported |
| Breakpoints | Tailwind defaults | sm, md, lg, xl |

## Screenshot Instructions

1. Admin Dashboard: Navigate to /admin/ after login; capture full view
2. Servers table: Navigate to /admin/servers; verify cell alignment, overflow, truncation
3. Dark mode: Toggle theme via ThemeProvider; verify contrast, z-index
4. Responsive: Test at 375px, 768px, 1024px; verify layout

## Component Paths

- Table: shared/src/ui/table/Table.tsx, cellUtils.tsx
- Button: design-system/components/Button/
- Typography: shared/src/ui/typography/Text.tsx, Heading.tsx
- Z-index: shared/src/theme/z-index.ts

## Storybook Variants Needed

Default, hover/focus, disabled, loading, error, empty for shared components. storybook-check.mjs enforces 38 components with title+description. Addon-essentials provides controls.
