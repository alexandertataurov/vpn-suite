# Production UI technical specification

**Target:** React + Vite | **Quality bar:** Revolut / Linear / Stripe / Notion / Vercel

> **Note:** Canonical tokens: [[07-docs/frontend/design/design-system|design/design-system.md]], [[07-docs/frontend/design/typography-tokens|design/typography-tokens.md]]. Use `var(--token-name)`; avoid hardcoded values.

---

## 1. Visual style definition

| Attribute | Decision |
|-----------|----------|
| **Aesthetic** | Minimal, confident, premium fintech/SaaS |
| **Depth** | Soft elevation via subtle shadows; no heavy drop shadows |
| **Hierarchy** | Typography-first; color supports, not dominates |
| **Structure** | Card-based sections; clear groupings; generous whitespace |
| **Noise** | No gradients except subtle radial accents; no textures; no decorative patterns |
| **Feel** | Expensive, calm, trustworthy |

---

## 2. Color system

### Primary palette (light mode)

| Token | HEX | Usage |
|-------|-----|-------|
| `--color-primary` | `#2563eb` | CTAs, links, active states |
| `--color-primary-hover` | `#1d4ed8` | Hover on primary |
| `--color-primary-active` | `#1e40af` | Active/pressed primary |
| `--color-secondary` | `#64748b` | Secondary actions |
| `--color-accent` | `#6366f1` | Highlights, badges |

### Neutral scale (10-step)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--neutral-50` | `#f8fafc` | `#0f172a` | Background tints |
| `--neutral-100` | `#f1f5f9` | `#1e293b` | Surface raised |
| `--neutral-200` | `#e2e8f0` | `#334155` | Borders light |
| `--neutral-300` | `#cbd5e1` | `#475569` | Borders |
| `--neutral-400` | `#94a3b8` | `#64748b` | Muted text |
| `--neutral-500` | `#64748b` | `#94a3b8` | Secondary text |
| `--neutral-600` | `#475569` | `#cbd5e1` | Tertiary text |
| `--neutral-700` | `#334155` | `#e2e8f0` | Body text |
| `--neutral-800` | `#1e293b` | `#f1f5f9` | Headings |
| `--neutral-900` | `#0f172a` | `#f8fafc` | Display text |

### Semantic colors

| Token | Light | Dark |
|-------|-------|------|
| `--color-success` | `#059669` | `#34d399` |
| `--color-warning` | `#d97706` | `#fbbf24` |
| `--color-error` | `#dc2626` | `#f87171` |
| `--color-info` | `#0284c7` | `#38bdf8` |

### Surfaces

| Token | Light | Dark |
|-------|-------|------|
| `--color-bg` | `#ffffff` | `#0f172a` |
| `--color-surface` | `#f8fafc` | `#1e293b` |
| `--color-surface-raised` | `#ffffff` | `#334155` |
| `--color-surface-elevated` | `#ffffff` | `#475569` |

### Text

| Token | Light | Dark |
|-------|-------|------|
| `--color-text` | `#0f172a` | `#f8fafc` |
| `--color-text-muted` | `#64748b` | `#94a3b8` |
| `--color-text-subtle` | `#94a3b8` | `#64748b` |

### Borders

| Token | Light | Dark |
|-------|-------|------|
| `--color-border` | `#e2e8f0` | `#334155` |
| `--color-border-subtle` | `#f1f5f9` | `#1e293b` |
| `--color-border-strong` | `#cbd5e1` | `#475569` |

### Disabled

| Token | Value |
|-------|-------|
| `--color-disabled-bg` | `var(--neutral-100)` / `var(--neutral-800)` |
| `--color-disabled-text` | `var(--neutral-400)` |
| `--opacity-disabled` | `0.5` |

---

## 3. Typography System

### Font stack

```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
--font-mono: "SF Mono", "Cascadia Code", Consolas, monospace;
```

### Scale

| Token | Size | Weight | Line-height | Letter-spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `--text-display` | 32px | 600 | 1.2 | -0.02em | Hero, empty states |
| `--text-h1` | 28px | 600 | 1.25 | -0.02em | Page title |
| `--text-h2` | 22px | 600 | 1.3 | -0.01em | Section title |
| `--text-h3` | 18px | 600 | 1.35 | 0 | Card title |
| `--text-body` | 16px | 400 | 1.5 | 0 | Body |
| `--text-body-sm` | 14px | 400 | 1.45 | 0 | Secondary body |
| `--text-caption` | 12px | 400 | 1.4 | 0 | Labels, captions |
| `--text-button` | 14px | 500 | 1.25 | 0 | Button text |
| `--text-button-sm` | 12px | 500 | 1.2 | 0 | Small button |

### Weights

| Token | Value |
|-------|-------|
| `--font-regular` | 400 |
| `--font-medium` | 500 |
| `--font-semibold` | 600 |
| `--font-bold` | 700 |

---

## 4. Spacing and layout rules

### Base unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `--space-0` | 0 | Reset |
| `--space-1` | 4px | Tight gaps |
| `--space-2` | 8px | Inline spacing |
| `--space-3` | 12px | Component padding |
| `--space-4` | 16px | Section gaps |
| `--space-5` | 20px | Card padding |
| `--space-6` | 24px | Page section |
| `--space-8` | 32px | Large section |
| `--space-10` | 40px | Major section |
| `--space-12` | 48px | Section divider |
| `--space-16` | 64px | Hero spacing |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Badges, chips |
| `--radius-md` | 8px | Inputs, buttons |
| `--radius-lg` | 12px | Cards |
| `--radius-xl` | 16px | Modals, panels |
| `--radius-full` | 9999px | Pills, avatars |

### Layout

| Token | Value |
|-------|-------|
| `--container-sm` | 480px |
| `--container-md` | 720px |
| `--container-lg` | 960px |
| `--container-xl` | 1200px |
| `--content-max-width` | 640px |
| `--sidebar-width` | 256px |
| `--header-height` | 56px |

### Grid

- 12-column grid on desktop
- 4px gutter
- Min column width: 200px

---

## 5. Component system

### Buttons

| Variant | Background | Text | Border | Hover | Active |
|---------|------------|------|--------|-------|--------|
| **Primary** | `--color-primary` | white | none | `--color-primary-hover` | `--color-primary-active` |
| **Secondary** | transparent | `--color-text` | `--color-border` | `--neutral-100` | `--neutral-200` |
| **Ghost** | transparent | `--color-text-muted` | none | `--neutral-100` | `--neutral-200` |
| **Danger** | `--color-error` | white | none | darken 10% | darken 15% |

**Sizes:** sm 32px, md 40px, lg 48px  
**States:** Disabled `opacity: 0.5`; Loading: spinner + `pointer-events: none`

### Cards

| Type | Border | Shadow | Background |
|------|--------|--------|------------|
| **Default** | `1px solid var(--color-border-subtle)` | `0 1px 3px rgba(0,0,0,0.06)` | `--color-surface-raised` |
| **Interactive** | same | same + hover lift | same |
| **Highlighted** | `1px solid var(--color-primary)` 20% opacity | + ring | same |

**Padding:** `--space-5` (20px) default

### Tables

- Row height: 48px (compact 40px)
- Header: `--text-caption`, `--font-medium`, `--color-text-muted`
- Cell padding: 16px horizontal
- Border: `1px solid var(--color-border-subtle)` between rows
- Hover row: `--neutral-50` / `--neutral-800`

### Lists

- Row min-height: 48px
- Padding: 16px horizontal
- Chevron: 16px, `--color-text-muted`
- Divider: 1px `--color-border-subtle`

### Tabs

- Underline active: 2px `--color-primary`
- Inactive: `--color-text-muted`
- Hover: `--color-text`
- Padding: 12px 16px

### Modals

- Max width: 480px (sm), 560px (md), 640px (lg)
- Max height: 90vh
- Backdrop: `rgba(0,0,0,0.4)`
- Radius: `--radius-xl`
- Padding: 24px

### Toast

- Position: bottom-right (mobile: bottom-center)
- Duration: 3s
- Padding: 12px 16px
- Radius: `--radius-md`
- Shadow: `0 4px 12px rgba(0,0,0,0.15)`
- Variants: success (green tint), error (red tint), info (blue tint)

### Inputs

- Height: 40px (default), 48px (lg)
- Border: 1px `--color-border`; focus: 1px `--color-primary` + ring
- Radius: `--radius-md`
- Error: border `--color-error`, helper text below
- Placeholder: `--color-text-muted`

### Dropdowns

- Trigger: match button/input height
- Menu: `--color-surface-raised`, `--radius-md`, shadow `0 4px 12px rgba(0,0,0,0.1)`
- Item: 40px min-height, 12px padding
- Hover: `--neutral-100`

### Badges

| Variant | Background | Text |
|---------|------------|------|
| **Default** | `--neutral-200` | `--color-text` |
| **Success** | `--color-success` 15% | `--color-success` |
| **Warning** | `--color-warning` 15% | `--color-warning` |
| **Error** | `--color-error` 15% | `--color-error` |
| **Info** | `--color-info` 15% | `--color-info` |

**Size:** 12px font, 4px 8px padding, `--radius-sm`

### Status indicators

- Dot: 8px, semantic color
- Label: `--text-caption`
- Spacing: 8px between dot and label

### Progress

- Height: 4px (sm), 8px (md)
- Track: `--neutral-200`
- Fill: `--color-primary`
- Radius: `--radius-full`

---

## 6. Interaction and animation model

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | 0ms | None |
| `--duration-fast` | 100ms | Microfeedback |
| `--duration-normal` | 200ms | Transitions |
| `--duration-slow` | 300ms | Modals, panels |

### Easing

```css
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

> **Note:** Use design tokens from `apps/admin-web/src/design-system/tokens/tokens.css` (admin) or miniapp theme; avoid hardcoded values in components.

### Transitions

| Element | Property | Duration |
|---------|----------|----------|
| Button | `background-color`, `transform` | 100ms |
| Card hover | `box-shadow`, `transform` | 200ms |
| Modal | `opacity`, `transform` | 200ms |
| Toast | `opacity`, `transform` | 200ms |

### Feedback

- **Button press:** `transform: scale(0.98)` 100ms
- **Success:** Short scale pulse or checkmark animation
- **Error:** Shake 200ms or red flash
- **Loading:** Skeleton preferred over spinner; spinner 24px when needed

---

## 7. States and feedback system

| State | Visual | Interaction |
|-------|--------|-------------|
| **Default** | Standard styling | — |
| **Hover** | Lighter/darker background, cursor pointer | `transition` 100ms |
| **Active** | Pressed state (scale/shadow) | Immediate |
| **Focus** | 2px ring `--color-primary` 30% | Visible on keyboard |
| **Disabled** | `opacity: 0.5`, `cursor: not-allowed` | No pointer events |
| **Loading** | Skeleton or spinner | `pointer-events: none` |
| **Error** | Red border, helper text | — |
| **Success** | Green tint, optional checkmark | — |

---

## 8. Responsive rules

### Breakpoints

| Token | Value | Target |
|-------|-------|--------|
| `--bp-sm` | 640px | Large phone |
| `--bp-md` | 768px | Tablet |
| `--bp-lg` | 1024px | Desktop |
| `--bp-xl` | 1280px | Large desktop |
| `--bp-2xl` | 1536px | Wide |

### Rules

| Breakpoint | Layout |
|------------|--------|
| &lt; 640px | Single column; full-width cards; stacked forms; bottom sheet modals |
| 640–1024px | 2-column where appropriate; sidebar collapsible |
| ≥ 1024px | Sidebar persistent; max container 1200px; 3-col grid for dashboards |

### Mobile-first

- Base styles for mobile
- `min-width` media queries for larger screens
- Touch targets ≥ 44px

---

## 9. Accessibility requirements

| Requirement | Value |
|-------------|-------|
| **Contrast** | 4.5:1 body, 3:1 large text |
| **Touch target** | Min 44×44px |
| **Focus ring** | 2px solid, visible, `outline: none` + custom ring |
| **Reduced motion** | `@media (prefers-reduced-motion: reduce)` → `transition: none` |
| **Keyboard** | All interactive elements focusable; logical tab order |
| **Labels** | All inputs associated with visible labels |

---

## 10. Production implementation guidelines

### File structure

```
src/
├── styles/
│   ├── tokens.css      # Design tokens
│   ├── reset.css       # Minimal reset
│   └── globals.css     # Body, typography base
├── components/
│   └── ui/             # Primitives (Button, Card, Input...)
└── ...
```

### Token usage

- Use `var(--token-name)` everywhere; no magic numbers
- Define tokens in `tokens.css`; theme overrides in `[data-theme]` blocks

### Performance

- Avoid `box-shadow` with large spread; prefer subtle `0 1px 3px`
- Avoid `backdrop-filter` on low-end; use `@supports` fallback
- Use `transform` and `opacity` for animations (GPU-accelerated)

### Checklist

- [ ] All colors from token system
- [ ] All spacing from scale
- [ ] Typography scale applied
- [ ] Touch targets ≥ 44px
- [ ] Focus states visible
- [ ] Reduced-motion respected
- [ ] Light and dark themes

---

*Spec ready for React + Vite implementation. Extend with component-specific variants as needed.*
