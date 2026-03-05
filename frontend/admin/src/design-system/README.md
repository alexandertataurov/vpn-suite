# Design system

- **Entry:** `index.ts` (components), `design-system.css` (styles).
- **Layers:** `tokens` → `typography` → `primitives` → `widgets`.
- **Docs:** [docs/design-system.md](docs/design-system.md), [docs/design-principles.md](docs/design-principles.md).

| Folder       | Role |
|-------------|------|
| `tokens/`   | CSS vars (colors, spacing, type). |
| `typography/` | Type scale components (PageTitle, KpiValue, …). |
| `primitives/` | Base UI (Button, Card, Input, Nbar, …) + base + extended + dashboard layout CSS. |
| `widgets/`  | Shell (Topbar, SidebarNav) in `shell/`, dashboard widgets in `dashboard/`, VPN node UI in `vpn-node/`. Shell styles in `widgets/shell/shell.css`. VPN node widgets are server/VPN-scoped and use `@/features/vpn-nodes` for types and formatting. |
| `stories/`  | Storybook stories (e.g. forms). |
| `docs/`     | Design system spec and QA checklist. |
