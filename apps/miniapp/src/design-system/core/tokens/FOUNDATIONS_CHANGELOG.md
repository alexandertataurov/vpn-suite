## 2026-03-10

- Added runtime CSS parity coverage for typography and breakpoints.
  Reason: token modules and CSS could drift without failing CI.
  Affects: `src/test/token-parity.test.ts`, Storybook foundations audit, `design:check`.
  Migration: run `npm run test -- --run src/test/token-parity.test.ts` after token or CSS edits.

- Added Storybook environment parity checks and breakpoint matrix coverage.
  Reason: foundations review needed production-like head markup, theme attributes, and explicit viewport audit surfaces.
  Affects: `.storybook/preview.tsx`, `.storybook/preview-head.html`, foundations stories.
  Migration: use the Storybook viewport toolbar when reviewing page stories.

- Documented color semantics, motion usage mapping, and typography production usage.
  Reason: foundations stories described tokens but not enough decision rules.
  Affects: `Color.stories.tsx`, `Motion.stories.tsx`, `Typography.stories.tsx`.
  Migration: reference the foundations stories before introducing new status or motion behaviors.
