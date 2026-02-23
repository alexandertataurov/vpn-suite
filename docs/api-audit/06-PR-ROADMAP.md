# PR Roadmap (6–12 PRs)

**Audit Date:** 2025-02-21

---

## PR1 — Centralize Error Envelope + Pagination (Quick Win)

- **Objective:** Use `not_found_404` and `error_body` everywhere; introduce `PaginationParams(limit, offset)` max_limit=200
- **Files:** error_responses.py, routers (peers, devices, cluster, etc.)
- **Steps:** Add helpers; replace string detail with dict in 5–10 handlers
- **Test:** Assert 404/400 have `error.code`, `error.message`
- **Rollout:** Deploy; no breaking change
- **Rollback:** Revert PR

---

## PR2 — Cap devices list limit to 200

- **Objective:** Reduce DoS risk
- **Files:** devices.py — change `le=1000` to `le=200`
- **Breaking:** Clients passing limit>200 get 422 validation error
- **Test:** test_devices_list_limit_max_200
- **Rollout:** Deploy; document in changelog
- **Rollback:** Revert

---

## PR3 — Webhook Provider Auth Hardening

- **Objective:** Reject unknown providers; enforce telegram_stars secret
- **Files:** webhooks.py — `ALLOWED_WEBHOOK_PROVIDERS = ["telegram_stars", "mock"]`; 400 for unknown
- **Test:** test_webhook_unknown_provider_rejected
- **Rollout:** Deploy
- **Rollback:** Revert

---

## PR4 — Request ID + Structured Logging Consistency

- **Objective:** Ensure request_id in all error responses
- **Files:** error_responses.py (already injects); verify logging
- **Test:** test_error_responses_include_request_id
- **Rollout:** No behavior change
- **Rollback:** N/A

---

## PR5 — Pagination Schema Unification

- **Objective:** Shared `PaginationParams`; apply to all list endpoints
- **Files:** schemas/base.py, users, payments, subscriptions, audit, devices, peers
- **Test:** Contract test for pagination params
- **Rollout:** No breaking change if defaults match
- **Rollback:** Revert

---

## PR6 — Fix users list phone filter count

- **Objective:** Correct total when filtering by phone
- **Files:** users.py — add phone to count_stmt
- **Test:** test_list_users_phone_filter_total
- **Rollout:** Bugfix; no breaking
- **Rollback:** Revert

---

## PR7 — Webhook 409 Use Unified Error Shape

- **Objective:** Use `error_body` for 409 response
- **Files:** webhooks.py
- **Test:** test_webhook_409_shape
- **Rollout:** Minor; clients parsing detail may need update
- **Rollback:** Revert

---

## PR8 — Peers List Response Schema

- **Objective:** Add Pydantic response_model to peers list
- **Files:** peers.py, schemas
- **Test:** test_peers_list_schema
- **Rollout:** No breaking if schema matches current
- **Rollback:** Revert

---

## PR9 — Add Contract Tests

- **Objective:** Validate OpenAPI vs implementation; authz boundaries
- **Files:** tests/test_openapi_contract.py, tests/test_authz_boundaries.py
- **CI:** Add to quality gate
- **Rollout:** CI only
- **Rollback:** Remove tests

---

## PR10 — Observability: Trace ID Propagation

- **Objective:** Add X-Trace-ID support
- **Files:** request_logging_middleware, logging_config
- **Test:** test_trace_id_in_logs
- **Rollout:** Additive
- **Rollback:** Revert

---

## PR11 — Bot reset_device Scoping Verification

- **Objective:** Verify bot only resets devices for users in its context
- **Files:** devices.py, bot.py
- **Test:** test_bot_cannot_reset_other_users_device
- **Rollout:** May fix security gap
- **Rollback:** Revert

---

## PR12 — Agent Heartbeat Validation

- **Objective:** Validate server_id format/length before creating Server
- **Files:** agent.py, schemas/agent.py
- **Test:** test_agent_heartbeat_invalid_server_id_rejected
- **Rollout:** Reject malformed payloads
- **Rollback:** Revert

---

## Order of Execution

1. **Immediate:** PR2 (devices limit), PR3 (webhook provider) — security
2. **Quick wins:** PR1, PR4, PR6
3. **Refactor:** PR5, PR7, PR8
4. **Quality:** PR9
5. **Observability:** PR10
6. **Verification:** PR11
7. **Hardening:** PR12
