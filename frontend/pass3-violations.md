PASS 3 — Type Safety Hardening scan
Generated: 2026-03-06

Typecheck outputs:
- `frontend/admin-types.txt` (clean)
- `frontend/miniapp-types.txt` (clean)

Workspace scan (admin/src + miniapp/src):
- `: any` / `as any` / `as unknown as` / `@ts-ignore` / `@ts-nocheck` / `@ts-expect-error`
  - **No matches found** in application source.

Residual type-escape patterns (test/e2e only):
- miniapp e2e uses `window as unknown as {...}` to stub Telegram runtime:
  - `frontend/miniapp/e2e/visual-regression.spec.ts`
  - `frontend/miniapp/e2e/startup-deeplink.spec.ts`
  - `frontend/miniapp/e2e/responsive-layout.spec.ts`
  - `frontend/miniapp/e2e/checkout.spec.ts`
  - `frontend/miniapp/e2e/home.spec.ts`
  - `frontend/miniapp/e2e/device-issue.spec.ts`
  - `frontend/miniapp/e2e/onboarding-resume.spec.ts`
  - `frontend/miniapp/e2e/onboarding.spec.ts`
- admin e2e uses `window as unknown as {...}` for telemetry event collection:
  - `frontend/admin/e2e/telemetry-events.spec.ts`

Recommended next hardening (optional, low risk):
- Introduce typed test helpers for `window.Telegram.WebApp` stubs to avoid repeating `unknown as` blocks.
- Keep these confined to `e2e/` (acceptable) and do not expand into production TSX.

