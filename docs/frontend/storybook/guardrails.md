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

- `npm run storybook:check -w shared` — Validates stories exist for required components.
- `npm run build-storybook -w shared` — Builds Storybook for production.

## Scripts

- `storybook:check` — Node script in `frontend/shared/scripts/storybook-check.mjs`.
