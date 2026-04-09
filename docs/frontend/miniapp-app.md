# Miniapp (Telegram Mini App)

React app for VPN subscription and device management. Base path `/webapp/`.

**Design system:** [miniapp-design-system/README.md](miniapp-design-system/README.md) — [architecture](miniapp-design-system/architecture.md), [enforcement checklist](miniapp-design-system/enforcement-checklist.md), [layout](miniapp-design-system/layout-architecture.md). Token aliases remain in `apps/miniapp/src/design-system/styles/miniapp-primitives-aliases.css`. Admin system reference: [admin design system docs](admin-design-system/README.md).

**Storybook contract:** [../storybook-ai-contract.md](../storybook-ai-contract.md) and [../ai-ui-workflow.md](../ai-ui-workflow.md). Reusable UI changes are incomplete until stories, state coverage, interaction coverage, and visual review are updated.

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
