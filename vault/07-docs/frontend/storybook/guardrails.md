# Storybook Guardrails

## Conventions

- **Meta title**: Explicit `title` in every story Meta. Format: `Section/Group/Component` (e.g. `Components/Buttons/Button`).
- **Description**: Every component story must have `parameters.docs.description.component`.
- **Story names**: Prefer `Overview`, `Variants`, `States`, `Playground`, `Accessibility`, `EdgeCases`.
- **Tokens**: Use design tokens (`var(--color-*)`, `var(--spacing-*)`) — no raw hex or arbitrary px in stories.
- **Naming**: PascalCase for story exports.

## Required

- No undocumented component: every exported UI component must have a story.
- No ungrouped component: use sidebar hierarchy (Foundations, Components, Patterns, Admin).
- No raw hex in stories: use tokens or semantic colors.

## CI

- `pnpm --filter admin run storybook:guardrails` — Validates Storybook guardrails for the admin-owned Storybook surface.
- `pnpm --filter admin run build-storybook` — Builds Storybook for production.

## Scripts

- `storybook:guardrails` — Node script in `apps/admin-web/scripts/storybook-guardrails.mjs`.
