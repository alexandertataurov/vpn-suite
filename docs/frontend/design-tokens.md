# Design Tokens

Single source of truth for the admin dashboard. All components use these variables; no magic numbers or inline hex.

## Typography

| Token | Value | Usage |
|-------|--------|--------|
| --font-size-xs | 0.75rem | Captions, nav labels |
| --font-size-sm | 0.875rem | Secondary text, buttons |
| --font-size-base | 1rem | Body |
| --font-size-lg | 1.125rem | Section titles |
| --font-size-xl | 1.25rem | Page titles |
| --line-height-tight | 1.25 | Headings |
| --line-height-normal | 1.5 | Body |
| --line-height-relaxed | 1.75 | Long copy |
| --font-weight-normal | 400 | Body |
| --font-weight-medium | 500 | Labels |
| --font-weight-semibold | 600 | Titles |

## Spacing (4px base)

| Token | Value |
|-------|--------|
| --space-1 .. --space-4 | 4px .. 16px |
| --space-5 .. --space-8 | 20px .. 32px |
| --space-10, --space-12 | 40px, 48px |

## Border radius

| Token | Value |
|-------|--------|
| --radius-sm | 4px |
| --radius-md | 6px |
| --radius-lg | 8px |

## Elevation

| Token | Value |
|-------|--------|
| --elevation-0 | none |
| --elevation-1 | 0 1px 3px rgba(0,0,0,0.12) |
| --elevation-2 | 0 4px 12px rgba(0,0,0,0.15) |

## Colors (semantic)

| Token | Purpose |
|-------|--------|
| --color-bg-base, --color-bg-surface, --color-bg-elevated | Backgrounds |
| --color-text-primary, --color-text-secondary, --color-text-muted | Text |
| --color-border-default | Borders |
| --color-accent | Primary actions, links |
| --color-status-success, --color-status-warning, --color-status-error | Status only |
