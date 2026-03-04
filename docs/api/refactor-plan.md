# API Refactor Plan (Recommendations)

These are **non-breaking** recommendations based on current code behavior.

| Priority | Area | Issue | Risk | Recommendation | Migration Steps |
|---|---|---|---|---|---|
| P1 | Auth | Bot endpoints accept WebApp sessions via `get_admin_or_bot` | Medium | Split dependencies (`get_admin_or_bot` vs `get_admin_or_bot_or_webapp`) to avoid cross‑scope access | 1) Create explicit dependency for bot-only. 2) Update `/api/v1/bot/*` routes. 3) Update OpenAPI security requirements. |
| P1 | Error contract | Validation errors should match unified error envelope | Low (already fixed) | Keep `RequestValidationError` handler and add regression test | 1) Add test for 422 shape. 2) Ensure middleware ordering stays intact. |
| P2 | Pagination | Mixed `limit/offset` and `page/page_size`, plus no shared schema | Medium | Adopt `PaginationParams` for all list endpoints; deprecate `page/page_size` in favor of `limit/offset` or vice versa | 1) Define standard pagination schema. 2) Update endpoints. 3) Provide transitional support with deprecation warnings. |
| P2 | Success envelopes | Success responses vary (`{status: ok}` vs typed models) | Medium | Decide on a standard success envelope (or explicitly document per endpoint) | 1) Define contract. 2) Update handlers + OpenAPI. 3) Update clients. |
| P2 | Telemetry alias | `/api/telemetry/docker/*` is deprecated | Low | Maintain alias until clients migrate; add explicit deprecation notice in docs | 1) Track client usage. 2) Plan removal date. |
| P3 | Timestamp naming | Mixed `ts` and `*_at` fields | Low | Standardize timestamp field naming in schemas | 1) Decide convention. 2) Add new fields or aliases. 3) Deprecate old fields. |
| P3 | Contract tests | No automated OpenAPI vs route coverage | Medium | Add contract tests to ensure OpenAPI matches code | 1) Generate OpenAPI in test. 2) Compare to routes. 3) Fail CI on drift. |

---

## Additional Notes

- Prefer additive changes with deprecation warnings before removing any fields or endpoints.
- Update `docs/api/README.md` and regenerate `openapi/openapi.yaml` (`./manage.sh openapi`) as part of every migration.
