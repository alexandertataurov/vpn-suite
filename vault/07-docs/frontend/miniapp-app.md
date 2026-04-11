# Miniapp (Telegram Mini App)

React app for VPN subscription and device management. Base path `/webapp/`.

**Design system:** [[07-docs/frontend/miniapp-design-system/README|miniapp-design-system/README.md]] — [[07-docs/frontend/miniapp-design-system/architecture|architecture]], [[07-docs/frontend/miniapp-design-system/enforcement-checklist|enforcement checklist]], [[07-docs/frontend/miniapp-design-system/layout-architecture|layout]]. Token aliases remain in `apps/miniapp/src/design-system/styles/miniapp-primitives-aliases.css`. Admin system reference: [[07-docs/frontend/admin-design-system/README|admin design system docs]].

**Storybook contract:** [[07-docs/storybook-ai-contract|../storybook-ai-contract.md]] and [[07-docs/ai-ui-workflow|../ai-ui-workflow.md]]. Reusable UI changes are incomplete until stories, state coverage, interaction coverage, and visual review are updated.

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
