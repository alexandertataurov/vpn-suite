# VPN Suite Spec Pack

Repo-ready multi-file specification set for business logic, routing, billing, devices, telemetry, admin state handling, and monetization/growth flows.

## Suggested placement

```text
/docs/product/VPN-SUITE-BUSINESS-LOGIC-USERFLOWS-SPEC-V2.md
/docs/product/TELEMETRY-SCHEMA-V2.md
/docs/product/GROWTH-MONETIZATION-SPEC.md
/docs/backend/BILLING-STATE-MACHINE.md
/docs/backend/DEVICE-LIFECYCLE.md
/docs/frontend/MINIAPP-ROUTING-SPEC.md
/docs/admin/ADMIN-PANEL-STATE-MODEL.md
```

## Included docs

- `docs/product/VPN-SUITE-BUSINESS-LOGIC-USERFLOWS-SPEC-V2.md`
- `docs/product/TELEMETRY-SCHEMA-V2.md`
- `docs/product/GROWTH-MONETIZATION-SPEC.md`
- `docs/backend/BILLING-STATE-MACHINE.md`
- `docs/backend/DEVICE-LIFECYCLE.md`
- `docs/frontend/MINIAPP-ROUTING-SPEC.md`
- `docs/admin/ADMIN-PANEL-STATE-MODEL.md`

## Change intent

This pack turns the product into a more explicit state-driven system:
- cleaner billing and entitlement rules,
- fewer dead-end onboarding routes,
- better retention and restore flows,
- audit-friendly immutable ledgers,
- clearer admin/operator visibility.

## Recommended implementation order

1. Billing state model and grace.
2. Mini App session routing.
3. Device lifecycle and slot replacement.
4. Telemetry v2 rollout.
5. Growth / monetization surfaces and campaigns.
6. Admin inspection and support surfaces.

## Business process docs added

```text
/docs/ops/BUSINESS-PROCESS-ARCHITECTURE.md
/docs/ops/PROCESS-MAPS-L2.md
/docs/growth/CRM-LIFECYCLE-AUTOMATIONS.md
/docs/support/SUPPORT-SAVE-PLAYBOOK.md
/docs/finance/REVENUE-RECONCILIATION-RULES.md
/docs/analytics/KPI-OPERATING-SYSTEM.md
```

These docs turn the spec pack from product logic only into a fuller operating model:
- lifecycle process architecture,
- L2 business process maps,
- CRM automations and revenue journeys,
- support + save workflows,
- finance reconciliation controls,
- KPI operating system and review cadence.
