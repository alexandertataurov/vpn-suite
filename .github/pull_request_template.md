## Summary

- What changed:
- Why:

## Validation

- [ ] Relevant tests passed locally/CI
- [ ] No breaking API/UI behavior introduced

## Miniapp (if frontend/miniapp changed)

- [ ] No inline `style` prop; use tokenized CSS / design-system classes
- [ ] UI imports from `@/design-system` only (no direct `design-system/ui` or primitives paths)

## UI checklist

- [ ] Reusable UI changed through design-system layers, not page hacks
- [ ] Storybook stories added or updated
- [ ] Storybook contract inventory still passes for required miniapp executable stories
- [ ] Interaction or `play` coverage updated where needed
- [ ] Required Storybook contract gate (`pnpm run test-storybook:miniapp`) passed
- [ ] Visual review passed
- [ ] Mobile layout checked
- [ ] Long-content and edge state checked

## Accessibility

- [ ] Reviewed against [`docs/accessibility-checklist.md`](../docs/accessibility-checklist.md)
- [ ] WCAG 2.2 A/AA mobile checks are complete for touched features
- [ ] Screen reader, keyboard/external input, and touch-target checks completed where applicable

## Definition of Done

- [ ] Meets project DoD in [`docs/backlog/dod-mvp.md`](../docs/backlog/dod-mvp.md)
- [ ] QA checks completed (including accessibility checklist references)
