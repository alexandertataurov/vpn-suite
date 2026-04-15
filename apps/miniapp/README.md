# Miniapp (Telegram Web App)

React + Vite front-end for the Telegram Mini App: plans, settings, support, checkout, and the shared Amnezia-themed design system.

## Documentation

- **This app (area index):** [docs/README.md](docs/README.md)
- **Contributing (tokens, components, pages, Storybook):** [../../CONTRIBUTING.md](../../CONTRIBUTING.md)
- **Consumer UI spec:** [../../docs/frontend/design/amnezia-miniapp-design-guidelines.md](../../docs/frontend/design/amnezia-miniapp-design-guidelines.md)
- **Design system architecture (repo root `docs/`):** [../../docs/frontend/miniapp-design-system/README.md](../../docs/frontend/miniapp-design-system/README.md)

## Commands

From the repository root (pnpm workspace):

```bash
pnpm --filter miniapp dev
pnpm --filter miniapp test
pnpm --filter miniapp typecheck
pnpm --filter miniapp lint
pnpm --filter miniapp design:check
pnpm --filter miniapp storybook
```

From `apps/miniapp`:

```bash
pnpm run dev
pnpm run test
pnpm run typecheck
pnpm run lint
pnpm run design:check
pnpm run storybook
pnpm run test:e2e:local
pnpm run test:e2e:mock
```

Full CI-style check: `pnpm run ci` (see [package.json](package.json) for all scripts).

`test:e2e:local` and `test:e2e:mock` automatically include local Playwright shared-lib fallback from `~/.local/pwlibs` when present.

## Source layout (`src/`)

| Path | Role |
|------|------|
| `app/` | Shell, providers, routes, bootstrap, app-layer components (`App.tsx`) |
| `pages/` | Route-level screens |
| `page-models/` | View logic and data wiring for pages |
| `design-system/` | Tokens, primitives, compositions, styles |
| `api/` | Typed client and endpoint modules |
| `hooks/`, `context/`, `lib/` | Shared hooks, React context, utilities (includes `lib/telegram`, `lib/help-resources`) |
| `stories/` | Storybook CSF stories (see [docs/storybook/AGENTS.md](docs/storybook/AGENTS.md)) |
| `storybook/` | Storybook helpers (decorators, fixtures, page contracts) |
| `styles/app/` | App shell CSS layered after design-system imports |
| `telemetry/` | Client telemetry and global error wiring |
| `test/` | Vitest setup, fixtures, design guard tests |
