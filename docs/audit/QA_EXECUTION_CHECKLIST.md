## Miniapp Logic QA Execution Checklist

- [ ] Flow documented in `FLOW_INVENTORY.md`
- [ ] Entry points verified against routes and CTAs
- [ ] Preconditions verified against `WebAppMeResponse` and feature flags
- [ ] Success path tested (unit/integration/E2E as appropriate)
- [ ] Failure paths tested (network, backend error, invalid input)
- [ ] Retry path tested where applicable (payments, referral attach, onboarding sync)
- [ ] Reload/resume tested (bootstrap + page reload mid-flow)
- [ ] Telemetry start/success/failure verified in `/webapp/telemetry`
- [ ] Backend/frontend API contract verified for involved endpoints
- [ ] No mock/stub logic remains in page-models or hooks
- [ ] `FLOW_AUDIT_MATRIX.md` status updated with evidence links

