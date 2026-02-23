# Shared CSS layers

- **`src/theme/tokens.css`** — Generated from `tokens/*.json`. Do not edit by hand; run `npm run tokens` from `frontend/shared`.
- **`src/ui/styles.css`** — Component styles (Button, Input, Select, Panel, Table, Modal, Drawer, Toast, etc.) and layout utilities (`.m-0`, `.gap-xs`, `.gap-sm`, `.w-auto`, `.fs-sm`, `.overflow-auto`, `.max-w-200`, etc.). Use component classes from shared UI; use utility classes sparingly.
- **`src/utilities.css`** — Minimal utilities: `.hidden`, `.visible`, `.flex`, `.flex-col`, `.items-center`, `.justify-between`, `.justify-center`, `.text-left/center/right`, `.text-primary`, `.truncate`, `.w-full`. Prefer component classes; use for one-off layout.
- **`src/layout.css`** — Layout primitives: `.container`, `.stack` (`.stack--sm`, `.stack--lg`), `.cluster` (`.cluster--sm`, `.cluster--lg`), `.grid` (`.grid--2`, `.grid--3`), `.container-inline`. All use `--spacing-*` tokens.

Single spacing scale: use `--spacing-*` everywhere (not `--space-*`). See design-tokens.md.
