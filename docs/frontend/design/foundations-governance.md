# Foundations Governance

Design system token usage rules and enforcement. All contributors must follow these rules.

## Rules

### 1. No Raw Hex

Never use raw hex, rgb(), or hsl() values in components. Use design tokens only.

```tsx
// ❌ Forbidden
color: "#5469d4"
background: "rgb(13, 17, 23)"

// ✅ Required
color: "var(--color-interactive-default)"
background: "var(--color-background-primary)"
```

### 2. No Primitive Tokens in Components

Components must use **semantic tokens only**. Primitives (`--color-gray-500`, `--spacing-4`, etc.) are for token composition and documentation.

```tsx
// ❌ Forbidden in components
color: "var(--color-gray-500)"
padding: "var(--spacing-4)"

// ✅ Required
color: "var(--color-text-secondary)"
padding: "var(--spacing-component-padding)"
```

See `tokens-map.ts` for the canonical mapping.

### 3. Theme Awareness

All semantic tokens adapt to `data-theme`. Never hardcode theme-specific values.

- **Admin themes**: `dark`, `dim`, `light`
- **Miniapp themes**: `consumer-light`, `consumer-dark`

### 4. Required Component Mapping

When adding a new component, document its token usage in `tokens-map.ts` → `COMPONENT_TOKENS`.

## Enforcement

- **tokens-map.ts** — single source of truth for primitive vs semantic classification
- **storybook:check** — validates story coverage
- **foundations:lint** — (optional) ESLint rule or script to detect primitive/hex usage in components
- **guardrails** — `npm run guardrails` (from frontend root): raw-color check + `FOUNDATIONS_STRICT=1` foundations lint + storybook check

## PR / review checklist (UI)

Before merging changes that touch UI or design:

- [ ] No new hex/rgb/hsl in components or pages (run `npm run guardrails` from frontend root).
- [ ] New or changed components use semantic tokens only; Tailwind/classes use `var(--*)` where applicable.
- [ ] Typography uses `--text-*` or `--font-size-*` / shared `Text` / `Heading`.
- [ ] New shared components have a Storybook story with title and description.
- [ ] No new page-level visual CSS unless justified (layout-only is acceptable).
- [ ] Shared component preferred; app-local only when feature-specific.

## Token Layers

| Layer | Purpose | Direct use in components |
|-------|---------|--------------------------|
| **Primitives** | Raw scales (gray-50..950, spacing-1..64) | No |
| **Semantics** | Meaning (text-primary, interactive-default) | Yes |
| **Aliases** | Compatibility (color-primary, color-bg) | Yes (prefer canonical semantic) |

## When to Use / When Not to Use

### Colors

- **Use semantic**: backgrounds, text, borders, buttons, status
- **Don't use primitive**: except in tokens.css or new semantic definition
- **Don't use hex**: ever

### Spacing

- **Use semantic**: `--spacing-component-padding`, `--spacing-section-gap`
- **Use primitives only**: when composing new semantic tokens
- **Don't use px/rem**: except in tokens definition

### Typography

- **Use composite**: `--text-h1`, `--text-body`, `--text-button`
- **Don't use raw font-size/weight**: compose from tokens
