# Frontend Release TODO

## Release Blockers (Must Fix)

| ID | Title | Files | Root cause | Fix steps | Tests | Acceptance | Risk | Diff |
|----|-------|-------|------------|-----------|-------|------------|------|------|
| FE-001 | package-lock sync | frontend/package-lock.json | Lock out of sync with package.json | npm install in frontend | — | npm ci passes | Low | M |

*FE-001 was fixed during Phase 1; npm ci now passes.*

## High-Risk Bugs

| ID | Title | Files | Root cause | Fix steps | Tests | Acceptance | Risk | Diff |
|----|-------|-------|------------|-----------|-------|------------|------|------|
| — | None identified | — | — | — | — | — | — | — |

*Typecheck errors (FE-002–FE-018) were fixed in Phase 1.*

## Consistency Improvements

| ID | Title | Files | Root cause | Fix steps | Tests | Acceptance | Risk | Diff |
|----|-------|-------|------------|-----------|-------|------------|------|------|
| FE-010 | Add Storybook Loading/Error/Empty variants | shared ui stories | Plan requires explicit variants | Add Loading/Error/Empty stories to Button, Input, Select | — | Storybook builds, variants render | Low | S |

*FE-010 fixed: Added Error story (Button); Error, Empty, Loading stories (Input); Error, Empty, Loading stories (Select).*

## Cleanup (Dead Code)

| ID | Title | Files | Root cause | Fix steps | Tests | Acceptance | Risk | Diff |
|----|-------|-------|------------|-----------|-------|------------|------|------|
| — | None identified | — | — | — | — | — | — | — |

## PR Plan

1. **PR1 (Gates)**: Lint, typecheck, tests, build, storybook, token check — done in Phase 1
2. **PR2 (Tests)**: Add smoke/error E2E for uncovered routes (miniapp home/profile/help/referral; admin audit/settings)
3. **PR3 (UI)**: Storybook Loading/Error/Empty variants
4. **PR4 (Cleanup)**: Any dead code identified post-manifest

## Done = Shipped

- All release gates green
- Manifest complete
- RELEASE_TODO blockers resolved or deferred
- E2E pass (requires backend)
