# UI Primitives

All components are 100% reusable and consistent: they use design tokens, `cn()` for `className`, and a small set of props.

## API contract

- **className**: Every primitive accepts `className` and merges it with `cn(baseClass, variantClass, className)`.
- **Variants**: Where applicable: `variant` (e.g. primary | secondary | ghost | danger) and/or `size` (sm | md | lg).
- **Tokens**: Component CSS uses only `var(--*)` from `theme/tokens.css` (no hardcoded colors/shadows).

## List

| Primitive | Props | Notes |
|-----------|--------|------|
| **PrimitiveButton** | variant, size, icon, iconPosition, iconOnly, loading, className | primary, secondary, ghost, danger; sm, md |
| **PrimitiveInput** | size, invalid, className, ...inputProps | Label handled by Field |
| **PrimitiveSelect** | options, value, onChange, size, invalid | Label handled by Field |
| **PrimitiveCheckbox** | label, indeterminate, className | |
| **PrimitiveLabel** | size, required, className | |
| **PrimitiveField** | id, label, hint, error, required, children | |
| **PrimitiveText** | variant, as, className | body, label, caption, code, muted |
| **PrimitiveHeading** | variant, as, className | title |
| **PrimitiveBadge** | variant, size, className | neutral, success, warning, danger, info |
| **StatusBadge** | status, label?, className | ok, degraded, down, unknown |
| **PrimitiveDivider** | orientation, tone, className | |
| **PrimitivePanel** | variant, padding, className | surface, outline |
| **PrimitiveTableRow** | className | |
| **PrimitiveTableCell** | align, truncate, className | |
| **MetricCell** | align, truncate, mono, className | Numeric, right-aligned cells |
| **PrimitiveContainer** | size, padding, className | sm, md, lg |
| **PrimitiveStack** | direction, gap, align, justify, wrap | |
| **PrimitiveGrid** | columns, gap, minWidth | |
| **Button** | variant, size, loading, className, ...buttonProps | primary, secondary, ghost, danger; sm, md, lg |
| **Field** | id, label, error, children, className | Wraps any control with label + error slot |
| **Input** | label?, error?, id?, className, ...inputProps | Uses Field when label or error set |
| **Select** | options, value, onChange, label?, error?, id?, className | Uses Field when label or error set |
| **Checkbox** | label, id?, className, ...inputProps | |
| **Panel** | variant, className, children | surface, outline |
| **PanelHeader** | title, actions?, className | |
| **PanelBody** | className, children | |
| **Modal** | open, onClose, title, children, footer?, className | Focus trap, Escape |
| **ConfirmModal** | open, onClose, onConfirm, title, message, variant?, loading? | Composes Modal |
| **ConfirmDanger** | open, onClose, title, message, reasonRequired?, confirmTokenRequired?, onConfirm, ... | Composes Modal |
| **Drawer** | open, onClose, title?, width?, children, className | Focus trap |
| **Table** | columns, data, keyFn/keyExtractor, emptyMessage?, sortKey?, sortDir?, onSort?, selection?, className, data-testid? | |
| **Pagination** | offset, limit, total, onPage | Uses Button |
| **Skeleton** | variant?, width?, height?, className | default, line, card, list, shimmer |
| **LoadingSkeleton** | variant?, width?, height?, className | Canonical alias for Skeleton |
| **EmptyState** | icon?, title, description?, actions?, className | |
| **ErrorState** | title, message?, retry?, className, data-testid? | Uses Button for retry |
| **PageError** | title?, message?, requestId?, statusCode?, endpoint?, onRetry?, className | Uses Button |
| **Toast** | useToast() | success, error, info |

## Composing

- **Form row**: `<Field label="Name" error={err}><Input ... /></Field>` or `<Input label="Name" error={err} ... />`.
- **Panel with table**: `<Panel><PanelHeader title="Peers" actions={...} /><PanelBody><Table ... /></PanelBody></Panel>`.
