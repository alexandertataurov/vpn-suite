# Adaptive UI — test plan and a11y checklist

## Playwright viewport tests

See `admin/e2e/adaptive-ui.spec.ts`.

| Viewport | Width | Checks |
|----------|-------|--------|
| XS | 360px | No horizontal scroll; sidebar overlay; Servers as cards |
| SM | 640px | No horizontal scroll |
| MD | 1024px | No horizontal scroll; sidebar persistent |
| LG | 1440px | No horizontal scroll |

Additional (manual or CI): one chart resized after sidebar toggle; Lighthouse CLS/LCP; axe a11y on key pages.

## Accessibility checklist

- **Keyboard:** Full navigation (sidebar, top bar, tables, modals, command palette). No focus traps except modal/palette; Escape closes.
- **Skip link:** `a.skip-link[href="#admin-main"]` visible on focus; targets main content.
- **Focus rings:** Use `:focus-visible` and `--color-focus-ring`; no `outline: none` without replacement.
- **ARIA:** Landmarks (banner, main, nav, complementary); `aria-label` on icon-only buttons; `aria-live` for dynamic status.
- **Touch targets:** Min 44px for primary actions on XS/SM (nav links, primary buttons).

Optional CI: `@axe-core/playwright` on critical pages; Lighthouse budget for LCP/CLS.
