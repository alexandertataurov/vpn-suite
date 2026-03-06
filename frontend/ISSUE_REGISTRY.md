ISSUE REGISTRY — vpn-suite frontend
Generated: 2026-03-06
Source: Pass 2 scans (`ts-prune`, `depcheck`, hook surface + utils candidates)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ARCH-001] Package manager mismatch (npm vs pnpm)                           Severity: H
  Evidence:
  - CI uses pnpm (see `.github/workflows/frontend-ci.yml`, `.github/workflows/design-system.yml`)
  - Local scripts in `frontend/package.json` and workspaces mix npm/pnpm usage.
  Impact:
  - Lockfile divergence / non-deterministic installs.
  Next:
  - Address in Pass 6 (choose one package manager path across CI + local).

[ARCH-002] Shared workspace introduced but shared API surface still evolving Severity: M
  Evidence:
  - `frontend/shared/` exists and is consumed by both workspaces.
  - TS project references now compile shared types via `tsc -b`.
  Risk:
  - Shared exports can accrete quickly; keep surface intentionally small.
  Next:
  - Ongoing: keep `frontend/shared/src/index.ts` minimal per consumer needs.

[DEP-001] Admin workspace missing runtime deps used in code                Severity: H
  Evidence (`frontend/admin-depcheck.txt`):
  - Missing `qrcode.react` used by `frontend/admin/src/features/devices/DevicesPage.tsx`
  Impact:
  - pnpm installs can fail / runtime module-not-found depending on hoisting.
  Next:
  - Fix in next increment (add to `frontend/admin/package.json` dependencies).

[DEP-002] Admin Storybook missing dev dep                                 Severity: M
  Evidence (`frontend/admin-depcheck.txt`):
  - Missing `@storybook/manager-api` referenced in `frontend/admin/.storybook/manager.ts`
  Impact:
  - Storybook build/dev can fail for admin.
  Next:
  - Fix in Pass 6 or next small tooling increment (add devDependency).

[DEP-003] Miniapp has now-unused deps after shared extraction              Severity: M
  Evidence (`frontend/miniapp-depcheck.txt`):
  - Unused deps: `clsx`, `tailwind-merge` (moved behind `@vpn-suite/shared`’s `cn`)
  Impact:
  - Dependency drift; makes future audits noisy.
  Next:
  - Remove from `frontend/miniapp/package.json` if no longer imported directly.

[DEAD-001] Admin has a large amount of dead exports (barrels)              Severity: M
  Evidence (`frontend/admin-dead.txt`):
  - Many exports from `src/hooks/index.ts`, `src/design-system/primitives/index.ts`, etc.
  Impact:
  - Discoverability suffers; refactors become risky (public surface ≠ real surface).
  Next:
  - Pass 5 (hook surface consolidation) + prune unused barrel exports.

[DEAD-002] Miniapp has dead exports (barrels + design-system indices)      Severity: M
  Evidence (`frontend/miniapp-dead.txt`):
  - Many exports from `src/design-system/index.ts`, `src/hooks/index.ts`, etc.
  Next:
  - Pass 5 (hook surface) + prune/normalize public exports.

[DUP-001] Format utilities duplicated (admin vs miniapp)                   Severity: M
  Evidence (`frontend/utils-candidates.txt`):
  - Admin: `frontend/admin/src/shared/utils/format.ts`
  - Miniapp: `frontend/miniapp/src/lib/utils/format.ts`
  Impact:
  - Divergent formatting over time (already different signatures/types).
  Next:
  - Candidate for `frontend/shared/src/utils/format.ts` (Pass 1b follow-up or Pass 5).

[DUP-002] Error-message helper duplicated (admin vs miniapp)               Severity: M
  Evidence (`frontend/utils-candidates.txt`):
  - Admin: `frontend/admin/src/shared/utils/error.ts`
  - Miniapp: `frontend/miniapp/src/lib/utils/error.ts`
  Next:
  - Merge into `frontend/shared/src/utils/error.ts` (or keep separate intentionally).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Duplicate logic table (current, from scans)

| Logic | Admin location | Miniapp location | Action |
|-------|---------------|-----------------|--------|
| Format utils | `admin/src/shared/utils/format.ts` | `miniapp/src/lib/utils/format.ts` | Audit + merge into `shared/src/utils/format.ts` |
| Error message helper | `admin/src/shared/utils/error.ts` | `miniapp/src/lib/utils/error.ts` | Audit + merge into `shared/src/utils/error.ts` |
| Status maps | (was) `admin/src/shared/statusMap.ts` | (was) `miniapp/src/lib/statusMap.ts` | **Done** → `shared/src/utils/statusMap.ts` |
| `cn` helper | (was) `admin/src/shared/utils/cn.ts` | (was) `miniapp/src/lib/utils/cn.ts` | **Done** → `shared/src/utils/cn.ts` |
| API error typing | (was) `admin/src/shared/types/api-error.ts` | (was) `miniapp/src/lib/types/api-error.ts` | **Done** → `shared/src/types/api-error.ts` |
| WebApp types | (was) `admin/src/shared/types/webapp.ts` | (was) `miniapp/src/lib/types/webapp.ts` | **Done** → `shared/src/types/webapp.ts` |

