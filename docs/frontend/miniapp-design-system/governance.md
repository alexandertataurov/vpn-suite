# Miniapp design-system governance

Token usage rules and enforcement for the miniapp. All contributors must follow these rules.

## Source of truth (miniapp)

- **Base tokens:** `apps/miniapp/src/design-system/styles/tokens/base.css`
- **Consumer theme:** `apps/miniapp/src/design-system/styles/theme/consumer.css` (`html[data-theme="consumer-dark" | "consumer-light"]`)
- **Telegram bridge:** `apps/miniapp/src/design-system/styles/theme/telegram.css` (`--ds-*` vars mapped onto Telegram `--tg-theme-*` + consumer tokens)
- **Layout and shell:** `apps/miniapp/src/design-system/styles/layout/zones.css`, `apps/miniapp/src/design-system/styles/shell/frame.css`

These files define the canonical design tokens and aliases. All other layers consume them.

## Rules

### 1. No raw hex

Never use raw hex, rgb(), or hsl() values in components. Use design tokens only.

```tsx
// ❌ Forbidden
color: "#5469d4"
background: "rgb(13, 17, 23)"

// ✅ Required
color: "var(--color-interactive-default)"
background: "var(--color-background-primary)"
```

### 2. Semantic tokens in components

Components must use **semantic tokens** (e.g. `--color-text-secondary`, `--spacing-component-padding`). Primitives like `--color-gray-500` are for token composition and documentation only.

### 3. Theme awareness

All semantic tokens adapt to `data-theme`. Miniapp themes: `consumer-light`, `consumer-dark`. Never hardcode theme-specific values.

### 4. Inline style policy

Inline styles are forbidden in app and design-system production code.

- **Allowed:** `src/stories/**` and `src/storybook/**` when used for foundations documentation or isolated visual scaffolding.
- **Forbidden:** `src/app/components/**`, `src/pages/**`, `src/design-system/**` outside stories.
- Prefer extracting recurring story layout objects into shared story helpers instead of redeclaring them inline.

### 5. Typography

- Use `--typo-*` or `--ds-font-*` tokens for size and weight. Miniapp aliases live in `telegram.css` and `apps/miniapp/src/design-system/tokens/typography.ts`.
- Do not introduce raw `px` or `rem` font-size values in product code.
- Use `Display`/`H1`/`H2`/`H3`/`Body`/`Caption` or tokens; do not hardcode `font-size` except inside Storybook-only showcase stories.

### 6. Color

- Use `--color-*` semantic tokens from `base.css` and `consumer.css` (bg, surface, surface-2, text, text-muted, text-tertiary, border, accent, success, warning, error, info).
- Telegram theme overrides flow through `--ds-color-*`; app code should not read `--tg-theme-*` directly.
- No raw hex/RGB in miniapp TS/TSX/CSS; always bind to an existing `--color-*` or `--ds-color-*` token.

### 7. Spacing, radius, motion

- Spacing: `--spacing-*`, `--space-*` from base.css plus miniapp layout vars (`--miniapp-page-gap`, `--miniapp-section-gap`, `--miniapp-card-padding` from zones.css).
- Radius: `--radius-*` + `--miniapp-radius-*` from consumer.css.
- Motion: `--duration-*` and `--ease-*` from base.css (and MOTION_TOKENS in TS).
- No ad-hoc `margin: 14px` / `border-radius: 10px` / `transition: 0.2s` in app CSS.

### 8. Layout contract

- Viewport + safe areas: `zones.css` owns `--app-height`, `--safe-*`, `--miniapp-*` layout vars.
- Shell: `.miniapp-shell`, `PageFrame`, `PageSection`, hero and mission/home patterns define the only allowed page scaffolding.
- Miniapp pages should compose `PageFrame` + design-system patterns/components; avoid bespoke page wrappers with their own spacing/grid systems.

## Enforcement

- **design:check** — `npm --prefix frontend run design:check -w miniapp` (single :root, no inline styles in app code, no direct lucide imports, page imports from `@/design-system`, no page-local CSS, token drift, token-parity test).
- **guardrails** — From frontend root: `pnpm run guardrails` runs miniapp design:check and related checks.
- **ESLint** — Forbids inline `style` props outside Storybook-only folders.
- **New patterns** — Add both CSS (under `styles/content`) and a Storybook story that documents the pattern before wiring it into a page.

## PR checklist (miniapp UI)

- [ ] No new hex/rgb/hsl in components or pages; no inline styles outside stories.
- [ ] New or changed components use semantic tokens only.
- [ ] Typography uses `--typo-*` / `--ds-font-*` tokens or shared text primitives.
- [ ] New shared components have a Storybook story.
- [ ] No new page-level visual CSS unless justified (layout-only is acceptable).
- [ ] Prefer design-system exports (`Button`, `Field`, `SettingsCard`, `Mission*`, `Page*` layouts, etc.) over raw `<button>`, `<input>`, and ad hoc layout wrappers.
- [ ] New miniapp components that are reused across pages live under `apps/miniapp/src/design-system`; pages in `src/pages` mostly compose existing primitives/patterns.
- [ ] New miniapp CSS only in design-system layers (`styles/tokens`, `styles/theme`, `styles/layout`, `styles/shell`, `styles/content`); no page-scoped CSS outside the design-system tree.
