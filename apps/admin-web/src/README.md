# Admin SPA — src layout

Preferred mental order for layers (not enforced by path):

| Layer | Path | Purpose |
|-------|------|---------|
| App entry | `main.tsx`, `App.tsx` | Bootstrap, root providers, shell |
| Routing | `app/` | Router, root layout, lazy route defs |
| Core | `core/` | API client, auth, errors, telemetry, loading |
| Features | `features/<name>/` | Route-level pages (Overview, Servers, …) |
| Layout | `layout/` | Shell, sidebar, topbar, nav; `layout/shell.css` |
| Design system | `design-system/` | Tokens, typography, primitives, widgets; single CSS: `design-system.css` |
| Hooks | `hooks/` | Shared React hooks (auth, API, devices, …) |
| Shared | `shared/` | Types, constants, utils, theme (cross-app) |

**Imports:** Use `@/` alias (e.g. `@/core/api/context`, `@/design-system/primitives`). Prefer `@/design-system` for UI, `@/shared` for types/constants.

**Design system:** Docs in `design-system/docs/` (design-system.md, design-principles.md). Stories next to components under `design-system/stories/`.
