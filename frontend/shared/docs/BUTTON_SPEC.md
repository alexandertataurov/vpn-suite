# Button Design Spec

## Contract

The `Button` component is the **single source of truth** for button styling across Admin and Miniapp. All button-like interactions use this component (or `ButtonLink` for navigation).

---

## Variants

| Variant | Use case | Styling |
|---------|----------|---------|
| `primary` | Primary CTA | Filled, brand color |
| `secondary` | Secondary actions, cancel | Surface bg, border |
| `ghost` | Tertiary, icon buttons | Transparent, hover surface |
| `outline` | Secondary with visible border | Transparent, bordered |
| `danger` | Destructive (delete, revoke) | Error color filled |
| `link` | Inline link-like (minimal) | Text only, no border/bg |

---

## Sizes

| Size | min-height | Use |
|------|------------|-----|
| `sm` | 28px | Compact UI, toolbars |
| `md` | 36px | Default |
| `lg` | 44px | Primary CTAs (a11y touch target) |
| `icon` | Square (same as sm/md/lg) | Icon-only; requires `aria-label` |

---

## States

| State | Behavior |
|-------|----------|
| default | Base styling |
| hover | Slightly brighter/lifted |
| active | Pressed feedback (translateY or filter) |
| focus-visible | Consistent focus ring (2px, primary color) |
| disabled | `pointer-events: none`, reduced opacity |
| loading | Spinner, `aria-busy`, non-interactive |

---

## Rules

1. **Icon-only buttons** MUST have `aria-label` (enforced via TypeScript when `iconOnly` is true).
2. **Focus ring** — single style: `outline: 2px solid var(--color-primary)` + offset.
3. **Disabled** — `cursor: not-allowed`, `opacity: 0.6`, no pointer events.
4. **Loading** — Spinner inside button; `loadingText` optional to avoid layout shift.
5. **Typography & spacing** — Token-based only (`--font-size-*`, `--spacing-*`).

---

## Props (API)

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| variant | `primary` \| `secondary` \| `ghost` \| `outline` \| `danger` \| `link` | `primary` | |
| size | `sm` \| `md` \| `lg` \| `icon` | `md` | |
| kind | `default` \| `connect` | `default` | `connect` = primary CTA, size lg, min 44px |
| loading | boolean | false | Shows spinner |
| loadingText | string? | — | Accessible text during loading |
| disabled | boolean | — | |
| fullWidth | boolean | false | `width: 100%` |
| startIcon | ReactNode | — | Icon before children |
| endIcon | ReactNode | — | Icon after children |
| iconOnly | boolean | false | When true, requires `aria-label` |
| asChild | boolean | false | Render as child (Slot pattern) |
| className | string | — | Merged; avoid layout-breaking overrides |
| children | ReactNode | — | |
| ...rest | ButtonHTMLAttributes | — | `type`, `onClick`, etc. |

---

## ButtonLink

Same variants/sizes. Renders `<Link>` with button styling. Use for in-app navigation. No `asChild` needed.

---

## Exceptions (documented)

- **Tab buttons** — Use shared Tabs component (different semantics: `role="tab"`).
- **Dropdown menu items** — May use button classes for styling; semantic is menu item.
- **Admin hamburger** — `admin-menu-btn` can remain if design differs; otherwise migrate to `Button variant="ghost" size="icon"`.
