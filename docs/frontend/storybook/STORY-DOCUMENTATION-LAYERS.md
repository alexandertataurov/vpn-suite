# Storybook documentation layers

This doc defines the **Layer 1–6** conventions for the admin design-system Storybook so that component docs, story descriptions, naming, story sets, data, and argTypes stay consistent.

## Design system build order

The design system is built in this dependency chain (each layer may only use layers below it):

1. **Foundations** — Tokens, color, typography, spacing, layout, radius, shadows, motion
2. **Primitives** — Box, Container, Stack, Inline, Panel, Divider, Text, Heading
3. **Components** — Button, Input, Switch, Modal, Toast, etc. (single-purpose UI)
4. **Patterns** — FormField, ToggleRow, ActionCard, EmptyStateBlock, MissionCard (reusable compositions)
5. **Recipes** — PageHeader, PlanCard, NewUserHero (domain-specific compositions)
6. **Pages** — Full page compositions

Storybook sidebar follows this order. New components must respect the chain (e.g. recipes use patterns, not raw components).

---

## Layer 1 — Component description

**Where:** `meta.parameters.docs.description.component`

**Format:** Single string (or array joined by `\n\n`) with **`##` headings** (not `###`). Include:

- **Overview** — What the component is and when to use it.
- **Anatomy** — Main parts (container, label, leading/trailing elements, state layer).
- **Variants** — Visual/semantic variants (e.g. primary, secondary, sizes).
- **States** — Default, hover, focus, disabled, loading, error where relevant.
- **Behavior** — Interaction and keyboard/screen reader notes.
- **Dos and Don'ts** — Short **Do:** / **Don't:** bullets.
- **Accessibility** — Required labels, ARIA, contrast, focus.
- **Design tokens consumed** — Which CSS variables / tokens it uses.
- **Related components** — Links to ButtonLink, Field, etc.

Use this for every component and for pattern/overview meta (e.g. Navigation/Overview, Patterns/EmptyStates).

### Curated composition order

Structure `description.component` so the flow feels intentional:

1. **Title** — Component name + status badge (from meta/hero)
2. **Summary** — One-line description
3. **Primary preview** — Best example (Default story)
4. **Usage guidance** — Do/Don't, when to use
5. **Variants** — AllVariants, AllSizes
6. **States** — AllStates, Disabled, Loading
7. **API** — ArgsTable / Props
8. **Accessibility** — Notes, keyboard, ARIA

### parameters.docs schema

Use these parameters for premium docs (Admin and Miniapp):

| Parameter | Type | Purpose |
|-----------|------|---------|
| `docs.startHere` | string \| ReactNode | Start-here block content |
| `docs.whenToUse` | string[] | "Use when" bullets |
| `docs.whenNotToUse` | string[] | "Avoid when" bullets |
| `docs.usage` | `{ doItems, dontItems }` | Do/Don't examples |
| `docs.limitations` | string[] | Known limitations |
| `docs.recipes` | `{ title, code, description?, language? }[]` | Copy-paste recipes |
| `docs.related` | `{ label, href, description? }[]` | Related components |

### Callouts

Use `Callout` (Admin) or `DocsCallout` (Miniapp) in MDX for:

- **info** — General note
- **tip** — Best practice
- **warning** — Constraint or caveat
- **danger** — Don't use / deprecation
- **accessibility** — A11y note (use `info` with a11y content)

Example (MDX):

```mdx
<Callout variant="warning" title="Constraint">
  Do not use this component for form validation.
</Callout>
```

---

## Layer 2 — Story description

**Where:** `story.parameters.docs.description.story`

**Format:** Per-story description. Prefer the full template:

- **What this story shows:** One line.
- **When you'd use this:** One line (e.g. "Reference", "Responsive check", "A11y audit").
- **Key props in use:** List or one line.
- **What to watch:** What to verify (layout, contrast, wrap, etc.).
- **Real product example:** Where this appears in the app (e.g. "/admin/servers", "Telemetry panel") or "N/A" for Playground.

Use `\n\n`-joined strings or a single string with `**bold**` for the headings. Playground stories can use the same template with "Sandbox / Exploration / N/A / N/A" where appropriate.

---

## Layer 3 — Story sets per category

**Primitives:** Prefer a consistent set: `Default`, `AllVariants`, `AllSizes` (if applicable), `AllStates`, `WithIcons` (if applicable), `InContext`, `EdgeCases`, `Playground`, plus `DarkModeVariant`, `ResponsiveLayout`, `Accessibility` where useful.

**Composites:** Same idea; add `InContext` when the component is used in a realistic block.

**Patterns:** Include `Default`, `WithRealData` (or product-like data), `States`, `ResponsiveLayout`, `DarkModeVariant`, `EdgeCases`, `Compositions` (embedded in chrome), `Accessibility`. For error patterns add **ErrorRecovery** (retry → success/content).

**Foundations:** Reference-only; `Default` plus any reference stories (e.g. Semantic, Usage, Playground).

**Pages:** `Default`, `Playground`, `AllVariants` / `InContext`, `DarkModeVariant`, `EdgeCases`, `Accessibility`, and any product-specific story (e.g. `OverviewStrips`).

---

## Layer 5 — Naming conventions

**Story export names:** Use consistent names across the design system:

- `Variants` → **AllVariants**
- `Sizes` → **AllSizes**
- `States` → **AllStates**
- `WithRealContent` → **InContext**
- `DarkMode` → **DarkModeVariant**
- `Responsive` → **ResponsiveLayout**
- Density-related (e.g. table) → **DensityCompact** where it fits

Keep **Playground**, **Default**, **EdgeCases**, **Accessibility**, **Compositions**, **ErrorRecovery** as-is.

---

## Layer 6 — argTypes

**Where:** `meta.argTypes`

For every prop that should appear in the docs/controls:

- **description** — Short, clear sentence.
- **control** — `"text"`, `"boolean"`, `"select"`, or `false` for ReactNode/callbacks.
- **table** — Include:
  - `type: { summary: "string" }` (or the real type).
  - `defaultValue: { summary: '"value"' }` when relevant.
  - `category`: one of `"Appearance" | "Behavior" | "Content" | "Accessibility" | "Advanced"` (and `"Events"` where used).
- **options** — For enum-like props, set `options: ["a", "b", "c"]` when using `control: "select"`.

Use `.storybook/utils/storyTypes.ts` for the shared `ArgCategory` type if you want typed categories.

---

## Data

- **Shared story data:** Prefer `frontend/admin/.storybook/data` — use `types.ts` for interfaces and `index.ts` (and generators) for seeded data. Import from `../../../../.storybook/data` or `../../../.storybook/data` depending on depth.
- **No inline heavy data:** Move repeated arrays/objects (e.g. error scenarios, table rows, activity data) into `.storybook/data` and import them.

---

## Quick checklist for new stories

1. **Meta:** Layer 1 component description with `##` sections.
2. **Each story:** Layer 2 story description (full template).
3. **Story set:** Default, variants/sizes/states, InContext, EdgeCases, Playground, etc. (Layer 3).
4. **Names:** AllVariants, DarkModeVariant, InContext, etc. (Layer 5).
5. **argTypes:** description, control, table (type, defaultValue, category), options for enums (Layer 6).
6. **Data:** Use `.storybook/data` for shared fixtures.
