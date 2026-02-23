# Badge Design System Specification

## 1. Badge Roles

| Role | Use case | Example |
|------|----------|---------|
| **Status** | State (online/offline/active/paid/failed) | Server status, user banned, payment completed |
| **Label/Tag** | Categorization (region, plan, feature) | Region filter, node type |
| **Count** | Numeric indicator | Notifications (1, 9, 99+) |

Use **PrimitiveBadge** for all three. Prefer semantic props over ad-hoc styling.

---

## 2. Variant Taxonomy

### 2.1 Canonical intents

| Variant | Meaning | Use when |
|---------|---------|----------|
| `neutral` | Default, unknown, inactive | Neutral state, no strong connotation |
| `info` | Informational | Pending, loading, metadata |
| `success` | Positive, healthy | Active, online, paid, completed |
| `warning` | Caution | Degraded, pending action, partial |
| `danger` | Error, blocked | Failed, offline, banned, error |

*Note: Alias `default`→neutral, `error`→danger for backward compat.*

### 2.2 Domain mappings (single source: statusMap.ts)

| Domain | Status | Variant |
|--------|--------|---------|
| **Server** | online, running, ok | success |
| | offline, error | danger |
| | degraded | warning |
| | unknown | neutral |
| **User** | active | success |
| | inactive, banned | danger |
| **Subscription** | active | success |
| | expired | warning |
| | cancelled | neutral |
| | failed | danger |
| **Payment** | completed | success |
| | pending | info |
| | failed | danger |
| | refunded | neutral |
| **Stream** | live | success |
| | degraded | warning |
| | offline | danger |
| **Container** | running | success |
| | restarting, paused | warning |
| | dead, exited | danger |
| **Device** | active | success |
| | revoked | danger |
| **Connection** | connected | success |
| | degraded | warning |
| | disconnected | danger |
| **Data** | live | success |
| | stale, partial | warning |
| | error | danger |
| | empty, loading | info |

---

## 3. Sizes

| Size | Font | Padding | Row height impact |
|------|------|---------|-------------------|
| `sm` | --font-size-xs | 2px 6px | Minimal, fits table rows |
| `md` | --font-size-sm | 4px 10px | Default |

Default: `md`. No `lg` unless design system adds it later.

---

## 4. Shape

- **Pill** (default): `border-radius: 9999px` / `var(--radius-full)`
- Optional `soft`: `var(--radius-md)` — only if design requires non-pill

---

## 5. Component API (PrimitiveBadge)

```ts
interface PrimitiveBadgeProps {
  variant?: "neutral" | "info" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  /** Render as child (e.g. Link) via Slot */
  asChild?: boolean;
  children: ReactNode;
  className?: string;  // Layout only, not restyling
}
```

- `forwardRef<HTMLSpanElement>`
- `className` escape hatch documented as layout-only

---

## 6. Do / Don't

| Do | Don't |
|----|-------|
| Use `statusMap` helpers for domain statuses | Re-invent status→variant logic per page |
| Use `PrimitiveBadge` with `ds-badge-dot` class for dot status | Create custom badge CSS per feature |
| Use `variant="info"` for filter tags | Use random colors for same semantic |
| Keep `className` for layout only | Override colors via className |
| Prefer `size="sm"` in tables | Use `size="md"` when compact is better |

---

## 7. Usage Guidelines

| Use Badge when | Use text/icon when |
|----------------|--------------------|
| Status, tag, or count needs emphasis | Plain label or inline text |
| Table cell status | Simple text list |
| Filter chips / categorization | Single-line descriptions |
| Notification counts | No count to show |

Do not use badges for:
- Primary actions (use Button)
- Long descriptions
- Critical alerts (use InlineAlert / banner)
