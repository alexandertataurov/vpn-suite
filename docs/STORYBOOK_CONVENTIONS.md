# Storybook Conventions

## Story structure

- **Meta title**: Use explicit `title` in Meta (e.g. `"Components/Button"`, `"Foundations/Colors"`). Never rely on path-derived titles.
- **Story naming**: PascalCase, descriptive (e.g. `AllVariants`, `DisabledState`, `WithError`, `Playground`).
- **Required**: `tags: ["autodocs"]` for component stories.
- **Description**: Add `parameters.docs.description.component` for every component.

## Sidebar hierarchy

- `Design System/Introduction` — Intro
- `Foundations/*` — Colors, Typography, Spacing, Radius, Shadows, Icons, Motion
- `Components/Buttons/*`, `Components/Inputs/*`, `Components/Data Display/*`, etc. — Nested groups
- `Patterns/*` — Forms, TablesWithActions, EmptyStates, LoadingStates, ConfirmationFlows
- `Admin/*` — PageHeader, Breadcrumb, MetricTile, StatusBadge, ServersEmptyState, MiniappLayout

## Per-component checklist

- Default story
- Variants story (if applicable)
- States (disabled, loading, error)
- Playground story with full `args` (for complex components)

## Code

- Use `createMeta` from `frontend/shared/src/storybook/meta.ts` (optional) for consistency.
- No undocumented components; no ungrouped components; no inconsistent naming.
