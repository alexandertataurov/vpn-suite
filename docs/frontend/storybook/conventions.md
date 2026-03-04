# Storybook Conventions

**Full spec:** [STORY-DOCUMENTATION-LAYERS.md](STORY-DOCUMENTATION-LAYERS.md) — Layer 1 (component docs), Layer 2 (story descriptions), Layer 3 (story sets), Layer 5 (naming), Layer 6 (argTypes), and shared data.

## Story structure

- **Meta title**: Use explicit `title` in Meta (e.g. `"Components/Buttons/Button"`, `"Foundations/Color"`). Never rely on path-derived titles.
- **Story naming**: PascalCase; use Layer 5 names: `AllVariants`, `AllSizes`, `DarkModeVariant`, `InContext`, `EdgeCases`, `Playground`, `ErrorRecovery` (patterns), etc.
- **Description**: Layer 1 — `parameters.docs.description.component` with `##` sections (Overview, Anatomy, Variants, States, Behavior, Dos and Don'ts, Accessibility, Design tokens, Related). Layer 2 — each story has `parameters.docs.description.story` (What this story shows / When you'd use this / Key props / What to watch / Real product example).

## Sidebar hierarchy

- `Foundations/*` — Color, Typography, Spacing, Radius, Shadows, Icons, Motion
- `Components/*` — Grouped into Buttons, Inputs, Navigation, Feedback, Data Display, Overlays, Layout, Misc (see [structure.md](structure.md)).
- `Patterns/*` — Component and app patterns (EmptyStates, ErrorStates, LoadingStates, BulkActionsBar, MetricRow, etc.).
- `Navigation/*` — Overview, NavRail, Sidebar, AppShell
- `Pages/*` — Dashboard, Servers, Telemetry

See [structure.md](structure.md) for full IA.

## Per-component checklist

- Default story
- AllVariants / AllSizes / AllStates (as applicable)
- InContext, EdgeCases
- Playground with args
- DarkModeVariant, ResponsiveLayout, Accessibility where useful
- **Patterns:** WithRealData, ErrorRecovery (for error pattern), Compositions

## Code and data

- **argTypes:** description, control, table (type, defaultValue, category), options for enums (Layer 6).
- **Data:** Use `frontend/admin/.storybook/data` for shared fixtures; avoid heavy inline data in stories.
- No undocumented components; consistent naming (Layer 5).
