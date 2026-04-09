# Primitives review — variants & organization

## Inventory (by complexity)

### Already have variants/sizes
| Primitive | Variants / options | Notes |
|-----------|--------------------|--------|
| **Button** | variant: default, primary, solid, ghost, success, warning, danger (+ secondary compat); size: sm, md, lg; iconOnly | Good coverage |
| **Badge** | variant: neutral, success, warning, danger, info, accent; size: sm, md, lg; pulse | Good |
| **Tabs** | variant: underline, pill, bordered | Good |
| **Modal** | size: sm, md, lg; variant: default, danger | Good |
| **Meter / Progress** | variant: info, success, warning, danger | Good |
| **Toast** | variant: info, success, warning, danger | Good |
| **Stepper** | step state: pending, active, completed, error | Good |

### No variants (candidates)
| Primitive | Suggested variants | Priority |
|-----------|--------------------|----------|
| **Card** | variant: default, elevated, outlined, interactive | Medium |
| **Input** | size: sm, md, lg (only state: error, success today) | High |
| **Drawer** | placement: right, left; size: sm, md, lg (width) | High |
| **DataTable** | density: default, compact; optional: striped | Medium |
| **Table** | variant: default, striped, bordered; density: default, compact | Low (use DataTable) |
| **SectionHeader** | size: sm, md, lg | Low |
| **EmptyState** | variant: default, compact | Low |
| **ErrorState** | severity: error, warning (visual only) | Low |
| **Accordion** | variant: default, bordered | Low |
| **Pagination** | size: sm, md | Low |
| **Breadcrumb** | (separator already via child) | Skip |

## Index order (grouped)

Suggested export order in `index.ts`:

1. **Feedback / loading**: Skeleton, Spinner, Progress, Meter, AnimatedNumber, Nbar
2. **Layout / surfaces**: Card, Widget
3. **Buttons / links**: Button, AnchorButton, LinkButton
4. **Form controls**: Input, Slider, DatePicker
5. **Overlays**: Modal, Drawer, Popover, ToastProvider, useToast
6. **Navigation**: Tabs, Accordion, Breadcrumb, Pagination, Stepper
7. **Data**: Table, DataTable, VirtualTable
8. **Content**: SectionHeader, Timeline
9. **Status / labels**: Badge, BadgeCount
10. **States**: EmptyState, ErrorState
11. **Composite**: CommandPalette

## Done in code (this pass)

- **Card**: `variant?: 'default' | 'elevated' | 'outlined' | 'interactive'`
- **Input**: `size?: 'sm' | 'md' | 'lg'`
- **Drawer**: `placement?: 'left' | 'right'`, `size?: 'sm' | 'md' | 'lg'`
- **DataTable**: `density?: 'default' | 'compact'`
- **SectionHeader**: `size?: 'sm' | 'md' | 'lg'`

CSS classes added for new variants; styles can be refined in primitives*.css.
