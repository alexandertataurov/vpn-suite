---
date: 2026-04-11
task: React exhaustive-deps triage (006)
files_changed:
  - apps/miniapp/src/features/onboarding/OnboardingPage.tsx
  - apps/miniapp/src/page-models/upsell/getUpgradeOfferForIntent.ts
  - apps/admin-web/src/features/billing/BillingPage.tsx
  - vault/05-journal/2026-04-11-react-exhaustive-deps-triage.md
---

## Summary

**OnboardingPage:** Replaced empty-deps `useEffect` with a ref gate so `onboarding_started` fires once when `session` first becomes non-null, with correct `[session, track]` dependencies. **getUpgradeOfferForIntent:** Removed unused `resolveTrialEnd` parameter and the unused-vars suppression. **BillingPage:** Hoisted `runPlanAction` and plan action handlers into `useCallback`, then listed them in `planRows` `useMemo` deps so the exhaustive-deps rule passes without inline disables. ESLint (`pnpm exec eslint … --fix`) passes on all three files.
