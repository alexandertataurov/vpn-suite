# Support Page — CSS Conflict & Drift Audit

**Date**: 2026-03-19

## Issue: Contact card subtitle (ri-sub) shows 14px instead of 11.5px

### Root cause: CSS load order

- `routes.css` is in app layer (main chunk).
- `RowItem.css` is loaded via component import; when Support is lazy-loaded, RowItem.css is in the route chunk and loads **after** routes.css.
- `.ri-sub` (RowItem.css) then overrides `.support-contact-card .ri-sub` (routes.css) due to later load order.

### Cascade & conflicts

| Rule | File | Load order | font-size |
|------|------|------------|-----------|
| `.ri-sub` | RowItem.css | Route chunk (later) | var(--amnezia-row-sub, var(--font-size-sm)) |
| `.ri-sub` @360px | RowItem.css | Route chunk | var(--font-size-xs) = 12px |
| `.ri-sub` @360px | responsive.css | Design-system | var(--amnezia-row-sub-sm, 11px) |
| `.support-contact-card .ri-sub` | routes.css | Main chunk (earlier) | Lost to RowItem.css |

### Fix applied

- `subtitleClassName="support-contact-sub"` on contact RowItem.
- `.support-contact-sub { font-size: var(--amnezia-row-sub, 11.5px) !important; }` in routes.css.
- `!important` guarantees override regardless of load order.

---

## Full drift audit (Support page)

| Check | Status |
|-------|--------|
| Hardcoded hex colors | None |
| Inline styles | None |
| Legacy tokens | Uses amnezia-* |
| section-desc | Uses var(--amnezia-hero-desc) |
| FaqDisclosureItem | Design-system component |
| RowItem / CardRow | Design-system |
| TroubleshooterFlowCard | Extracted recipe |
| support-contact-card | Semantic class only (no CSS) |
| support-contact-sub | Unique override for ri-sub 11.5px |
