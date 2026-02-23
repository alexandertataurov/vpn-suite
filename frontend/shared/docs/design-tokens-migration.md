# Design Tokens Migration Guide

The design system moved from a single `tokens.css` with hex/rgba to **JSON sources** and **OKLCH** with a 4-tier token hierarchy. Existing token names are kept working via **compatibility aliases**.

## Old → New token mapping

Use these for find-and-replace when migrating to semantic names. Aliases remain in place so no change is required for existing CSS.

| Old token | New token (semantic) |
|-----------|----------------------|
| `--color-bg` | `--color-background-primary` |
| `--color-surface` | `--color-background-secondary` |
| `--color-text` | `--color-text-primary` |
| `--color-text-muted` | `--color-text-secondary` |
| `--color-primary` | `--color-interactive-default` |
| `--color-primary-hover` | `--color-interactive-hover` |
| `--color-on-primary` | `--color-on-primary` (unchanged) |
| `--color-border` | `--color-border-default` |

Spacing, radius, shadow, and typography token **names** are unchanged; only their **values** may differ (e.g. fluid `clamp()` for font sizes, OKLCH for shadows). Duration `--duration-normal` is now 250ms (was 200ms). Ease `--ease-standard` now points to `--ease-in-out`.

## Build

- **Source:** `frontend/shared/tokens/*.json`
- **Output:** `frontend/shared/src/theme/tokens.css`
- **Command:** `npm run tokens` (from `frontend/shared`)

Do not edit `tokens.css` by hand; run the build after changing JSON.

## Breaking changes

- **Primitives:** Old hex primitives (`--gray-50`, `--blue-500`, etc.) are now OKLCH. If you referenced them directly, they remain but values differ slightly.
- **Removed:** None; aliases preserve old names.
- **New:** Semantic tokens (`--color-background-*`, `--color-text-*`, `--color-interactive-*`, etc.), `--text-*` composite styles, `--spacing-component-*`, `--blur-*`, `--opacity-*`, `--duration-*`, `--ease-*` (including `--ease-in-out`, `--ease-elastic`, `--ease-bounce`).

## Optional: remove aliases

When all consumers use semantic tokens, the compatibility block in the build script can be removed to drop `--color-bg`, `--color-surface`, etc. (breaking change for any remaining usages).
