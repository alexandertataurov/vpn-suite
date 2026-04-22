# Miniapp Design System Implementation Roadmap

## High priority

1. Finish onboarding and home CTA cleanup.
2. Keep the runtime theme bootstrap and Storybook theme sync aligned.
3. Standardize the most reused control contracts, starting with `Button` and `Input`.
4. Expand responsive coverage around the conversion surfaces and safe-area behavior.
5. Tighten empty, loading, success, and error patterns where the current UX is vague.

## Medium priority

1. Harden `Plan`, `Devices`, `Settings`, `Checkout`, `Support`, and `RestoreAccess` against narrow-width layout failures.
2. Add missing story states where the current contract is only partially exercised.
3. Normalize docs and storybook descriptions so the component API remains self-documenting.
4. Review composition patterns that are currently duplicated across recipes.

## Low priority

1. Add optional variant demos for already-stable controls.
2. Expand documentation examples for compound patterns.
3. Polish smaller motion details once the core flows are stable.

## Sequencing

- Week 1: audit, gap list, and CTA/theme fixes
- Week 2: token and API cleanup
- Week 3: responsive hardening for major flows
- Week 4: engagement patterns and final polish

## Success criteria

- `Button` and `Input` contracts are internally consistent and reflected in Storybook.
- Theme startup does not flash or drift between app and Storybook.
- Onboarding and home clearly communicate the next action.
- Responsive review covers the mobile widths that matter most.
- Empty, loading, success, and error states read like product copy instead of framework output.
