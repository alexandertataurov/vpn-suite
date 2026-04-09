# Miniapp Design System Enforcement Checklist

Version: 1.0
Audience: Miniapp frontend contributors and reviewers
Scope: `apps/miniapp/src/design-system/**` and miniapp app-layer usage

Use this checklist in code review and before merge. Every item is pass/fail.

---

## 1) Layer Boundaries

- `PASS`: `tokens/` exports values only (no runtime logic, no app imports).
- `PASS`: `theme/` wires global CSS/theme only.
- `PASS`: `primitives/` contain layout/typography/accessibility primitives only.
- `PASS`: `components/` compose primitives into reusable UI without feature business logic.
- `PASS`: `patterns/` compose DS components/primitives without data fetching or domain side effects.
- `PASS`: `recipes/` contain reusable page-shaped wrappers only; they do not fetch data or import app-layer services.
- `PASS`: feature logic stays in app layer (`src/pages`, `src/hooks`, feature services).
- `FAIL`: DS code imports page/domain services, API clients, or query/mutation logic directly.
- `FAIL`: new page-local structural wrappers are introduced when they should be promoted to `design-system/recipes` or `design-system/patterns`.

## 2) Token-Only Styling

- `PASS`: visual values come from semantic tokens/CSS vars.
- `PASS`: component/pattern TSX has no JSX inline style props.
- `PASS`: no hardcoded hex colors in TS/TSX app/UI code.
- `FAIL`: new one-off colors, spacing, radius, or shadow values added in component CSS/TSX.
- `FAIL`: ad-hoc `:root` token sources outside sanctioned token files.

## 3) Component API Consistency

- `PASS`: component variants use structured props (`variant`, `size`, `tone`, `disabled`, `loading`).
- `PASS`: composition is preferred over mega-prop surfaces.
- `PASS`: page containers compose page-model hooks with design-system/recipes components rather than deriving all state inline in TSX.
- `PASS`: pages do not own local CSS under `src/pages`; route styling is expressed through shared design-system styles and page recipes.
- `PASS`: each page zone has a single status owner. Do not repeat one state in a page-header badge, hero status, and section chip at the same time.
- `PASS`: section cards do not render a second header row inside a `PageSection` or `PageCardSection` unless that inner header introduces a real subsection.
- `FAIL`: boolean prop explosion (`primary`, `danger`, `small`, etc. in parallel).
- `FAIL`: duplicated component contracts for same UI role.
- `FAIL`: new CSS files or CSS imports are introduced under `src/pages`.
- `FAIL`: repeated status chrome such as `header badge + hero status + section chip` for the same semantic state.
- `FAIL`: nested header chrome such as `PageCardSection title + MissionModuleHead` for the same content block.

## 4) Accessibility Baseline

- `PASS`: semantic HTML and keyboard behavior are present by default.
- `PASS`: visible focus states remain intact.
- `PASS`: required ARIA roles/labels are applied for non-native controls.
- `FAIL`: clickable non-button/non-link elements without keyboard/ARIA handling.

## 5) Tests and Docs Expectations

- `PASS`: DS behavior changes include or update tests where behavior changed.
- `PASS`: component/pattern public changes include Storybook/story or doc updates.
- `PASS`: architecture-impacting changes keep [architecture.md](./architecture.md) in sync.
- `PASS`: new reusable page wrappers are documented in [README.md](./README.md).
- `FAIL`: API or behavioral changes merged without docs/test coverage.

## 6) Required Local Checks

Run from repo root:

```bash
npm --prefix frontend run typecheck -w miniapp
npm --prefix frontend run lint -w miniapp
npm --prefix frontend run design:check -w miniapp
npm --prefix frontend run build -w miniapp
```

CI mapping:

- `design:check`: `apps/miniapp/scripts/design-check.sh`
- `lint`: `eslint` (miniapp config + root workspace config)
- `typecheck`: `tsc -b`
- `build`: Vite production build

---

## 7) Mobile Platform Guidelines

- `PASS`: mobile UI changes follow [mobile-platform-guidelines.md](./mobile-platform-guidelines.md).
- `PASS`: tap targets, spacing, readable text, and focus states remain compliant with the shared iOS/Android subset.
- `FAIL`: platform guidance is bypassed by shrinking controls or text to fit.

---

## Reviewer Sign-Off

- [ ] Layer boundaries respected
- [ ] Tokens/styling rules respected
- [ ] API contract consistency maintained
- [ ] Accessibility checks passed
- [ ] Tests/docs updated
- [ ] Mobile platform guidelines respected
- [ ] Local checks passed
