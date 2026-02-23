# Design System for New Products

How to reuse the VPN Suite design system in a new app or white-label product.

## 1. Install and import

- Add `@vpn-suite/shared` as a dependency (or link the local `frontend/shared` package).
- In your app entry (e.g. `main.tsx`):

```ts
import "@vpn-suite/shared/global.css";
```

- Wrap the app with `ThemeProvider` and, if using toasts, `ToastContainer`:

```tsx
import { ThemeProvider, ToastContainer } from "@vpn-suite/shared";

<ThemeProvider>
  <ToastContainer>
    <App />
  </ToastContainer>
</ThemeProvider>
```

## 2. Tokens and theming

- All tokens live in `@vpn-suite/shared/theme/tokens.css` (included via `global.css`).
- Switch theme by setting `data-theme="light"` or `data-theme="dark"` on a root element (e.g. `document.documentElement`). Default is dark.
- To rebrand, override CSS variables in your own CSS (after importing global.css):

```css
[data-theme="light"] {
  --color-primary: #your-brand;
  --color-primary-hover: #your-brand-hover;
}
```

See [design-tokens.md](./design-tokens.md) for the full token list.

## 3. Components to use

| Component | Use case |
|-----------|----------|
| `Button`, `ButtonLink`, `CopyButton` | Actions; use `Button kind="connect"` or `ButtonLink kind="connect"` for primary CTAs (size lg, min 44px). `CopyButton` for clipboard copy. |
| `Panel` | Containers; variants: `default`, `glass`, `raised`. |
| `Input` | Form fields; supports `label`, `error`. |
| `Select` | Dropdowns; pass `options`, `value`, `onChange`. |
| `SearchInput` | Search/filter fields with leading icon. |
| `PrimitiveBadge` | Status pills: `neutral`, `success`, `warning`, `danger`, `info`. |
| `HealthBadge` | Server/node status and domain health. |
| `DeviceCard`, `ProfileCard` | Domain cards (device list, subscription). |
| `Skeleton`, `SkeletonLine`, `SkeletonCard`, `SkeletonList` | Loading states. |
| `EmptyState` | Empty lists; pass `title`, `description`, optional `icon`, `actions`. |
| `Modal`, `ConfirmModal` | Dialogs; focus trap and Escape handled. |
| `ToastContainer`, `useToast()` | Notifications; top-right, auto-dismiss. |
| `Table`, `Pagination` | Data tables. |

## 4. Layout utilities

- `.page-content` — main content padding.
- `.page-content-narrow` — max-width 480px, centered.
- `.nav-links` — vertical list of links.
- `.card-title` — zero top margin for card headings.

## 5. Principles

1. **One primary action per screen** — one main button per view.
2. **State first** — show status (connected, active, expired) without extra clicks.
3. **Use tokens** — prefer `var(--spacing-md)`, `var(--color-primary)` over hard-coded values.
4. **Min 44px** for primary CTAs (use `Button kind="connect"` or `ButtonLink kind="connect"`).
5. **Loading and empty** — use `Skeleton` and `EmptyState` instead of spinners or blank space.
6. **Accessibility** — modals trap focus and close on Escape; primary buttons are at least 44px; use `aria-label` where needed.

## 6. Checklist for new pages

Before merging a new admin/miniapp page:

- Uses the same layout shell (AdminLayout or MiniappLayout).
- Loading: Skeleton (or table skeleton); error: PageError or InlineError; empty: EmptyState or table empty message.
- Forms use shared Input, Select (no native `<select>`); actions use shared Button.
- No hardcoded colors or font sizes in CSS; use tokens only. No inline `style={{ color: '…', fontSize: '…' }}`.
- Spacing: `--spacing-*` (single scale). Borders: `--border-subtle`, `--color-border-default` where appropriate.

## 7. Adding a new product in this repo

- Reuse the same `frontend/shared` package; no copy-paste.
- Import `global.css` and wrap with `ThemeProvider` (and `ToastContainer` if needed).
- Override only the tokens you need for the new brand.
- Prefer shared components; add product-specific ones in the app and keep primitives in shared.
- When porting from `_design_ref`, use [ref-to-token-mapping.md](./ref-to-token-mapping.md); do not paste Tailwind or hex into apps.
