# Mini App Beta Shared Task Log

Date: 2026-03-19
Owner: Codex main coordinator

Scope:
- Beta-release UI audit for `apps/miniapp/src`
- Do not modify tests
- Do not touch unrelated in-flight `Devices` migration work already present in git status

DONE criteria for this polish pass:
- Active Mini App pages `Home`, `Plan`, `Settings`, `RestoreAccess`, and `Support` render through current design-system primitives without obvious beta drift from the stated constraints.
- Active buttons, badges, chips, rows, cards, banners, modals, sheets, and toggles use the current token/radius/focus conventions on the live Mini App path.
- Component-level `data-theme` usage is normalized so active `[data-theme="light"]` / `[data-theme="dark"]` selectors resolve correctly.
- Date formatting on active Mini App UI uses `formatDate(date, 'en-US')`.
- Reduced-motion, responsive, and safe-area behavior are present in the active stylesheet stack.
- `pnpm --filter miniapp typecheck` and `pnpm --filter miniapp lint` pass from repo root.
- Residual legacy/admin/story-only drift outside active Mini App runtime is documented rather than expanded into broad cleanup.

Shared constraints:
- Font: Inter only
- No hardcoded hex colors in component files; use tokens except where explicitly required
- No inline styles except one-off story layout
- No `!important` except where explicitly required
- No `min-height: 44px` on non-button elements
- Buttons and badges must keep `text-transform: none`
- Dark token selectors must use `[data-theme="dark"]`
- Dates must use `formatDate(date, 'en-US')`
- Cards, banners, modals radius: `14px` / `--r`
- Icon wraps, buttons, inputs radius: `10px` / `--r-sm`
- Stacked card gap: `8px`
- Page padding: `24px 16px`, bottom `max(110px, env(safe-area-inset-bottom) + 80px)`
- Reduced motion must disable all animations

Ownership:
- Agent 1: token integrity and global style entrypoints
- Agent 2: component audit in active miniapp component/design-system paths
- Agent 3: page audit for Home, Settings, Plan, Restore Access, Support
- Agent 4: responsive CSS pass only, no component logic edits
- Agent 5: animation system in shared stylesheet and selector wiring
- Main: integration, conflict resolution, final validation

Status:
- Agent 1: completed
- Agent 2: completed
- Agent 3: completed
- Agent 4: completed
- Agent 5: completed
- Main: completed
