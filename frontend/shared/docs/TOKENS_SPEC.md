# Tokens Spec — Operator-Grade (2026)

**Principle:** Tokens only. Strict scale. Operator-grade density.

## 1. Color Architecture

### 1.1 Primitive tokens
Raw palette for composition only.

### 1.2 Semantic tokens (component usage)

| Category | Tokens | Usage |
| --- | --- | --- |
| Background | `--color-bg`, `--color-surface`, `--color-surface-2`, `--color-overlay` | Page/surface/overlay |
| Text | `--color-text`, `--color-text-muted`, `--color-text-tertiary`, `--color-text-inverse` | Text roles |
| Border | `--color-border`, `--color-border-subtle`, `--color-border-strong` | Borders/dividers |
| Accent | `--color-accent`, `--color-accent-hover`, `--color-accent-active`, `--color-on-accent` | Actions |
| Status | `--color-success`, `--color-warning`, `--color-danger`, `--color-info` | Feedback |
| Focus | `--color-focus-ring` | Focus ring |

**Rules:**
- Components use semantic tokens only.
- Themes: `html[data-theme="light"]` and `html[data-theme="dark"]`.

## 2. Spacing

4px base scale.

| Token | Value |
| --- | --- |
| `--spacing-1` | 4px |
| `--spacing-2` | 8px |
| `--spacing-3` | 12px |
| `--spacing-4` | 16px |
| `--spacing-5` | 20px |
| `--spacing-6` | 24px |
| `--spacing-8` | 32px |
| `--spacing-10` | 40px |
| `--spacing-12` | 48px |
| `--spacing-16` | 64px |

## 3. Typography

Strict sizes: 12, 13, 14, 16.

| Token | Size |
| --- | --- |
| `--font-size-12` | 12px |
| `--font-size-13` | 13px |
| `--font-size-14` | 14px |
| `--font-size-16` | 16px |

Composite tokens:
- `--text-title`
- `--text-body`
- `--text-label`
- `--text-caption`
- `--text-code`

## 4. Radius

Max radius = 4px.

- `--radius-0`, `--radius-2`, `--radius-4`
- `--radius-control`, `--radius-surface`

## 5. Shadows

- `--shadow-none`
- `--shadow-sm` (optional, minimal)

## 6. Legacy compatibility

Legacy tokens remain as aliases in `tokens.css` during migration only.
