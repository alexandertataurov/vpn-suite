---
type: audit-checklist
updated: 2026-04-11
app: miniapp
repo_path: apps/miniapp
---

# Miniapp review — findings & todos

Lightweight audit of `apps/miniapp` (routes, entry, e2e, lint signals). Use with tasks **011** / **012** and existing **006** (React exhaustive-deps).

## Strengths

- **Routing:** Lazy-loaded feature routes in `apps/miniapp/src/app/routes.tsx`; redirects for legacy paths (`/servers`, `/account/subscription`).
- **Icons:** `lucide-react` centralized in `apps/miniapp/src/lib/icons.ts` (avoid scattered icon imports).
- **Quality scripts:** `design:check`, `token:drift`, `storybook:contract`, `build:ci` + CSS budget, Vitest + Playwright.
- **E2E:** Broad coverage (`onboarding`, `checkout`, `home`, `device-issue`, `business-flows`, `visual-regression`, `responsive-layout`, etc.).

## Todos (open)

- [ ] **Client hygiene:** Remove or strictly gate `console.log` in `apps/miniapp/src/main.tsx` (animation bypass) — see task **011**.
- [ ] **Hooks / lint:** Resolve `react-hooks/exhaustive-deps` and related suppressions — task **006** (`OnboardingPage`, `BillingPage`, `getUpgradeOfferForIntent`).
- [ ] **E2E gap:** Add dedicated smoke for **`/connect-status`** (page exists; not clearly covered by route-level specs) — task **012**.
- [ ] **Optional:** After 011/012, run `pnpm --filter miniapp ci` locally and fix any drift.

## Routes vs e2e (spot check)

| Route | Covered in e2e / visual |
|-------|-------------------------|
| `/`, `/onboarding`, `/plan`, `/plan/checkout/:id`, `/devices`, `/support`, `/referral` | Yes (multiple specs) |
| `/connect-status` | **Weak / add smoke** (task 012) |
| `/restore-access` | Via `business-flows` |

## References

- Repo: `docs/frontend/miniapp-app.md` / `vault/07-docs/frontend/miniapp-app.md`
- [[01-specs/obsidian-docs-conventions]]
