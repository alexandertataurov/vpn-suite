# UI Guide — Unified Design System

## Overview

Admin UI uses primitives from `frontend/admin/src/design-system/` and token-based styling. Avoid page-specific CSS and inline styles for visual properties.

## Tokens

Source (admin): `frontend/admin/src/design-system/tokens/tokens.css`  
Source (miniapp): `frontend/miniapp/src/design-system/styles/tokens/base.css`, `theme/consumer.css`

- **Colors**: `--color-text-primary`, `--color-text-secondary`, `--color-surface`, `--color-border`, etc.
- **Spacing**: `--spacing-1` … `--spacing-64`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`
- **Typography**: `--text-h1` … `--text-caption`, `--font-size-*`, `--line-height-*`
- **Radius**: `--radius-sm` … `--radius-full`, `--radius-lg`
- **Shadows**: `--shadow-sm`, `--shadow-md`, `--shadow-focus`

## Components

### Layout

| Component | Usage |
|-----------|--------|
| **Stack** | Flex column/row with gap. `direction`, `gap`, `align` |
| **FormStack** | Form layout: flex column, `--spacing-md` gap |
| **Inline** | Horizontal inline layout |

### Forms

| Component | Usage |
|-----------|--------|
| **Field** | Label + control + error. Wrap Input, Select, Checkbox |
| **Input, Select, Checkbox** | Form controls. Use `id` and `aria-label` |

### Buttons

| Component | Usage |
|-----------|--------|
| **Button** | `variant`: primary, secondary, ghost, danger; `size`: sm, md, lg |
| **ButtonLink** | Link styled as Button. Use for nav actions |

### Cards and Panels

| Component | Usage |
|-----------|--------|
| **Card** | `variant`: default, glass, raised, **panel** (settings-style) |
| **Card** `as="section"` | Semantic section for tabpanels |

### Typography

| Component | Usage |
|-----------|--------|
| **Text** | `variant`: body, muted, caption, code, danger |
| **Heading** | `level` 1–4 |
| **Stat** | Value + label + optional delta |

### Feedback

| Component | Usage |
|-----------|--------|
| **InlineAlert** | `variant`: info, warning, error; `title`, `message`, `actions` |
| **MetricTile** | KPI: label, value, subtitle, state |
| **Skeleton, Spinner, EmptyState, ErrorState** | Loading and empty states |

## Patterns

- **Form layout**: `<form><FormStack><Field>…</Field></FormStack></form>`
- **Settings panel**: `<Card as="section" variant="panel">…</Card>`
- **KPIs**: `<div className="ref-stats-grid"><MetricTile … /></div>`
- **Page header**: `<PageHeader title="…" description="…" primaryAction={…} />`

## Don’t

- Use `ref-action-btn`, `ref-settings-card`, `dashboard-muted`, `dashboard-value` (deprecated)
- Add `style={{}}` for colors, margins, fonts — use tokens or components. Layout (gap, flex) is acceptable.
- Duplicate button/card styling — use shared Button and Card

## Styleguide

`/styleguide` in admin shows live examples: tokens, typography, Button, Card, Badge, Modal, etc. Use it to verify component states (empty, loading, error, disabled).
