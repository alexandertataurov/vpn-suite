# Miniapp (Telegram Mini App)

React app for VPN subscription and device management. Base path `/webapp/`.

**Design system:** [docs/design-system/](docs/design-system/README.md) — [architecture](docs/design-system/architecture.md), [enforcement checklist](docs/design-system/enforcement-checklist.md), [layout](docs/design-system/layout-architecture.md). Token aliases: [src/design-system/styles/miniapp-primitives-aliases.css](src/design-system/styles/miniapp-primitives-aliases.css). Aligned with admin Primitives: [admin design-system docs](../admin/src/design-system/docs/design-system.md).

**Storybook contract:** [../../docs/storybook-ai-contract.md](../../docs/storybook-ai-contract.md) and [../../docs/ai-ui-workflow.md](../../docs/ai-ui-workflow.md). Reusable UI changes are incomplete until stories, state coverage, interaction coverage, and visual review are updated.

**Layer model:** Tokens → Foundations → Primitives → Components → Patterns → Layouts → Pages → States.

**Run:** From repo root, `./manage.sh up-core` (or frontend dev server on port 5175).

**Storybook scripts:**
- `pnpm run storybook:miniapp` (from frontend root)
- `pnpm run build-storybook:miniapp`
- `pnpm run test-storybook:miniapp` - stable reduced contract suite
- `pnpm run test-storybook:official:miniapp` - attempts the official Storybook test-runner first
- `pnpm run storybook:ci:miniapp`
- `pnpm --filter miniapp run chromatic -- --project-token=...`

CI currently treats `test-storybook` as the required gate. `test-storybook:official` is also run as a non-blocking compatibility probe.
