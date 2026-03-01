# Miniapp UI — Design System

Single source of truth for miniapp UI. All visual values from tokens. No inline styles (except whitelisted dynamic values in shared components).

## Tokens

Defined in `src/styles/tokens.css`:

| Category | Variables |
|----------|-----------|
| Colors | `--color-bg`, `--color-text`, `--color-accent`, `--color-success/warning/error`, etc. |
| Typography | `--text-h1`..`--text-caption`, `--font-sans`, `--line-height-*` |
| Spacing | `--space-1`..`--space-12` (8px grid: 4,8,12,16,20,24,32,48) |
| Radius | `--radius-sm`, `--radius-md`, `--radius-lg` |
| Layout | `--container-max`, `--container-pad`, `--height-header`, `--height-button`, `--app-height`, `--safe-top`, `--safe-bottom` |
| Z-index | `--z-header`, `--z-nav`, `--z-toast`, `--z-modal` |
| Breakpoints | `--bp-sm: 600px`, `--bp-md: 900px`, `--bp-lg: 1200px` |

**Rule:** No component may introduce a new color/spacing/radius outside tokens.

## Components

Re-exports from `@vpn-suite/shared/ui`: Button, ButtonLink, Panel, Input, InlineAlert, Skeleton, EmptyState, ConfirmModal, ProgressBar, DeviceCard, ToastContainer, useToast, PrimitiveBadge.

## Patterns

- **PageContent** — Page wrapper. Use instead of `<div className="page-content">`.
- **PageHeader** — Page title + subtitle + optional action.
- **Section** — Section with optional title and action. Uses tokens only.

## Usage

```tsx
import { PageContent, PageHeader, Section, Panel, Button } from "../ui";

function MyPage() {
  return (
    <PageContent>
      <PageHeader title="Title" subtitle="Subtitle" />
      <Section title="Section Title">
        <Panel className="card">Content</Panel>
      </Section>
      <Button variant="primary">CTA</Button>
    </PageContent>
  );
}
```

## Do / Don't

| Do | Don't |
|----|-------|
| Import from `../ui` | Import from `@vpn-suite/shared/ui` for shared components (ui re-exports them) |
| Use tokens for spacing/colors | Use arbitrary `px` or hex values |
| Use PageContent, PageHeader, Section | Use raw divs with layout classes |
| Use shared Button, Input, Panel | Use raw `<button>`, `<input>` |
| Use ProgressBar for load bars | Use inline `style={{ width }}` |

## Enforcement

- **ESLint:** `react/forbid-dom-props` forbids `style` on miniapp pages.
- **CI:** `npm run lint` must pass.
