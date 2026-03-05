# Miniapp UI — Design System

Single source of truth for miniapp UI. All visual values from tokens. No inline styles (except whitelisted dynamic values in shared components).

## Tokens

Defined in `src/lib/theme/tokens.css`:

| Category | Variables |
|----------|-----------|
| Colors | `--color-bg`, `--color-text`, `--color-accent`, `--color-success/warning/error`, etc. |
| Typography | `--text-h1`..`--text-caption`, `--font-sans`, `--line-height-*` |
| Spacing | `--space-1`..`--space-12` (8px grid: 4,8,12,16,20,24,32,48) |
| Radius | `--radius-sm`, `--radius-md`, `--radius-lg` |
| Layout | `--container-max`, `--container-pad`, `--height-header`, `--height-button`, `--app-height`, `--safe-top`, `--safe-bottom` |
| Z-index | `--z-header`, `--z-nav`, `--z-toast`, `--z-modal` |
| Breakpoints | `--bp-xs: 40rem`, `--bp-sm: 64rem`, `--bp-md: 90rem`, `--bp-lg: 120rem` |

**Rule:** No component may introduce a new color/spacing/radius outside tokens.

## Components

Re-exports from `@vpn-suite/shared/ui`: Button, ButtonLink, Panel, Input, InlineAlert, Skeleton, EmptyState, ConfirmModal, ProgressBar, DeviceCard, ToastContainer, useToast, PrimitiveBadge.

## Patterns

- **PageFrame** — Canonical page shell (`PageScaffold + PageHeader`).
- **PageScaffold** — Page wrapper for section stacking/rhythm.
- **PageHeader** — Page title + subtitle + optional action.
- **PageSection** — Section with title, description, and optional action.

## Usage

```tsx
import { PageFrame, PageSection, Panel, Button } from "../ui";

function MyPage() {
  return (
    <PageFrame title="Title" subtitle="Subtitle">
      <PageSection title="Section Title">
        <Panel className="card">Content</Panel>
      </PageSection>
      <Button variant="primary">CTA</Button>
    </PageFrame>
  );
}
```

## Do / Don't

| Do | Don't |
|----|-------|
| Import from `../ui` | Import from `@vpn-suite/shared/ui` for shared components (ui re-exports them) |
| Use tokens for spacing/colors | Use arbitrary `px` or hex values |
| Use PageFrame, PageSection | Use raw divs with layout classes |
| Use shared Button, Input, Panel | Use raw `<button>`, `<input>` |
| Use ProgressBar for load bars | Use CSS / token-based sizing |

## Enforcement

- **ESLint:** `react/forbid-dom-props` forbids `style` on miniapp pages.
- **CI:** `npm run lint` must pass.
