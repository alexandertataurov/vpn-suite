# Admin Console Design Audit

Date: March 13, 2026

## Context
- Admin console lives under `frontend/admin/src`; shell + navigation assemble the “VPN Suite Admin” experience through `DashboardShell`, `DashboardTopbar`, and `DashboardSidebar`.
- Design system primitives and widgets (e.g., `primitives-dashboard.css` and `widgets/shell/shell.css`) enforce the terminal-inspired tokens, but a few layout/accessibility gaps remain.

## Findings

1. **Navigation lacks a persistent semantic label and state hooks.** `DashboardSidebar` renders the menu via `SidebarNavRoot` but never surfaces `aria-label`, `role`, or an `id` to link from the hamburger button, so assistive tech cannot explain the nav container (see `frontend/admin/src/layout/DashboardSidebar.tsx:191-235`). The overlay backdrop also lacks `aria-hidden` or keyboard escape handling, so the temporary menu is harder to dismiss when focus bends away from it.
2. **Hamburger button omits expanded/controlled state.** `DashboardTopbar` only renders a `TopbarBtn` with `aria-label="Open menu"` at `frontend/admin/src/layout/DashboardTopbar.tsx:75-104`, but it never toggles `aria-expanded`, `aria-controls`, or visually cues that the nav is open; that leaves screen-reader users guessing whether the overlay is active.
3. **Status bar cannot wrap gracefully on narrow screens.** The CSS in `frontend/admin/src/design-system/primitives/primitives-dashboard.css:819-888` pins `.statusbar` and its children to fixed heights and inline layouts, so the “Quick links” buttons and status chips overflow as the viewport narrows (see `frontend/admin/src/layout/DashboardStatusBar.tsx:13-37` for the content that has to fit).

## Quick wins

- Wire `SidebarNavRoot` to accept an `id`/`aria-label` and expose that id to the hamburger so we can add `aria-controls`/`aria-expanded` feedback (`DashboardSidebar.tsx` + `DashboardTopbar.tsx`).
- Listen for `Escape` when the overlay is open and add `aria-hidden` to the backdrop button to make the temporary nav dismissible without relying on pointer targets (`DashboardShell.tsx` + overlay markup).
- Add a small-screen variant for `.statusbar` so its quick links wrap and the stats stay readable on tablets (`primitives-dashboard.css`).

## Next steps

- Implement the accessibility updates described above, then verify focus management for the overlay.
- Add responsive spacing to the statusbar, keeping the desktop animation intact.
- Re-run the admin styleguide or Storybook (if available) to confirm nothing regressed.
