# Storybook AI Contract

Storybook is the source of truth for reusable UI.

Rules:
1. Every shared component must have stories.
2. Every interactive component must have at least one behavioral story with a `play` function.
3. Any PR that changes reusable UI must update Storybook.
4. Page-level UI hacks are not allowed when the change belongs in a primitive, pattern, or layout component.
5. AI agents must inspect existing stories before editing pages.
6. New reusable components are incomplete until:
   - story exists
   - states are covered
   - interactions are covered where relevant
   - visual review passes

Additional repo conventions:
- Miniapp Storybook stories are colocated with components under `frontend/miniapp/src/**` and must use canonical titles such as `Foundations/*`, `Primitives/*`, `Patterns/*`, `Layouts/*`, `Pages/*`, and `States/*`.
- Storybook is the UI contract layer for engineers, designers, QA, and AI agents. If stories and production UI disagree, fix the design-system layer and update the stories.
- Storybook fixtures must use realistic Telegram miniapp copy, typed data, and mobile-safe layout constraints.
- The current required Storybook gate for the miniapp is the reduced contract suite exposed by `pnpm run test-storybook:miniapp`. The standalone official runner remains exploratory until the upstream Storybook 10 metadata issue is resolved.
- The reduced contract suite is also guarded by `pnpm run storybook:contract:miniapp`, which verifies the required executable Storybook stories and tags.
