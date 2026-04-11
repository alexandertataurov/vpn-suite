# Foundations Governance

Design system token usage rules and enforcement. All contributors must follow these rules.

## Source of truth

- **Admin:** `apps/admin-web/src/design-system/tokens/tokens.css`
- **Miniapp base:** `apps/miniapp/src/design-system/styles/tokens/base.css`
- **Miniapp consumer theme:** `apps/miniapp/src/design-system/styles/theme/consumer.css`
- **Miniapp theme aliases:** `apps/miniapp/src/design-system/styles/theme/telegram.css`

These files define the canonical design tokens and aliases. All other layers consume them.

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

### 5. Inline Style Policy

Inline styles are forbidden in app and design-system production code.

- Allowed (paths relative to each app): **Admin** `apps/admin-web/src/design-system/stories/**`; **Miniapp** `apps/miniapp/src/stories/**` and `apps/miniapp/src/storybook/**` when used for foundations documentation or isolated visual scaffolding.
- Forbidden: `src/app/components/**`, `src/pages/**`, `src/design-system/**` outside stories.
- Prefer extracting recurring story layout objects into shared story helpers instead of redeclaring them inline.

### 6. Typography Policy

- Use `--typo-*` or `--ds-font-*` tokens for size and weight decisions.
- Do not introduce raw `px` or `rem` font-size values in product code.
- Use `data-typo-tone` or semantic status classes for live-data color changes instead of hardcoded status colors.

## Enforcement

- **tokens-map.ts** — single source of truth for primitive vs semantic classification
- **`apps/miniapp/src/design-system/core/tokens/__tests__/token-parity.test.ts`** — verifies runtime CSS parity for typography and breakpoints
- **storybook foundations** — documents environment parity, motion usage, color semantics, and production examples
- **ESLint** — forbids inline `style` props outside Storybook-only folders
- **`design:check`** — runs token drift plus runtime parity checks
- **guardrails** — `pnpm run guardrails` (from frontend root): runs miniapp `design:check` (single :root, no inline styles in app code, no direct lucide imports, page imports from `@/design-system`, no page-local CSS, token drift, token-parity test)

## PR / review checklist (UI)

Before merging changes that touch UI or design:

- [ ] No new hex/rgb/hsl in components or pages; no inline styles outside stories (run `pnpm run guardrails` from frontend root).
- [ ] New or changed components use semantic tokens only; Tailwind/classes use `var(--*)` where applicable.
- [ ] New or changed shared components: token usage documented in `tokens-map.ts` → `COMPONENT_TOKENS` (see miniapp design-system).
- [ ] Typography uses `--typo-*` / `--ds-font-*` tokens or shared text primitives.
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
