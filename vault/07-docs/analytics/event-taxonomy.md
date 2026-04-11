# Event Taxonomy — VPN Suite Analytics

**Version:** 1.0  
**Source of truth:** This document  
**Scope:** Mini App, Admin Dashboard, API, Bot, Worker

---

## 1. Principles

- Every event has a **namespace** (miniapp, admin, api, auth, billing, referral, vpn, system).
- **Shared properties** apply to all events unless impossible.
- **Privacy:** No raw init_data, tokens, passwords, or PII in event payloads.
- **Identity:** Anonymous until auth validated; then `identify` with safe user ID.

---

## 2. Shared Properties

Attach to every analytics event where applicable:

| Property | Type | Required | Purpose |
|----------|------|----------|---------|
| event_version | string | yes | Schema version, e.g. "1.0" |
| app_name | string | yes | "vpn-suite-miniapp" \| "vpn-suite-admin" \| "admin-api" |
| app_surface | string | yes | "miniapp" \| "admin" \| "bot" \| "api" \| "worker" |
| environment | string | yes | "local" \| "staging" \| "production" |
| release | string | no | Git SHA or build version |
| session_id | string | no | Frontend session identifier |
| distinct_id | string | no | Identified user (hashed if needed) |
| anonymous_id | string | no | Anonymous visitor ID |
| request_id | string | no | X-Request-ID for correlation |
| trace_id | string | no | OpenTelemetry trace ID |
| telegram_platform | string | no | "ios" \| "android" \| "desktop" \| "unknown" |
| telegram_start_param | string | no | Start param / referral param (sanitized) |
| locale | string | no | User locale |
| page | string | no | Current route/page |
| screen | string | no | Feature/screen name |
| user_role | string | no | Admin role if applicable |
| client_ts | string | no | ISO 8601 client timestamp |
| server_ts | string | no | ISO 8601 server timestamp |

---

## 3. Namespaces and Events

### 3.1 miniapp.*

| Event | Purpose | Trigger | Required Props | Optional Props | Privacy | Source |
|-------|---------|---------|----------------|----------------|---------|--------|
| miniapp.opened | App launched | First render / Mini App open | screen | attribution (direct\|attachment\|bot_menu\|referral), start_param | low | miniapp |
| miniapp.ready | App ready | Bootstrap complete | — | — | low | miniapp |
| miniapp.closed | App closed | Before unload / visibility hidden | — | — | low | miniapp |
| miniapp.auth.started | Auth flow started | Before init data validation | — | — | low | miniapp |
| miniapp.auth.succeeded | Auth succeeded | After session established | — | — | low | miniapp |
| miniapp.auth.failed | Auth failed | Init data rejected | — | reason | low | miniapp |
| miniapp.page_view | Route viewed | Route change | screen_name | referrer_screen | low | miniapp |
| miniapp.cta_clicked | CTA clicked | User action | cta_name | screen_name, plan_id | low | miniapp |
| miniapp.plan_viewed | Plan page viewed | Plan screen visible | — | plan_id | low | miniapp |
| miniapp.plan_selected | Plan selected | User selects plan | plan_id | duration_days, price_amount, currency | low | miniapp |
| miniapp.checkout_started | Checkout started | Entered checkout | plan_id | promo_code | low | miniapp |
| miniapp.checkout_viewed | Checkout page viewed | Checkout screen visible | plan_id | — | low | miniapp |
| miniapp.payment_succeeded | Payment succeeded | Payment confirmed | plan_id | amount, currency | low | miniapp |
| miniapp.payment_failed | Payment failed | Payment error | plan_id | reason | low | miniapp |
| miniapp.referral_attached | Referral attached | Referral code attached | — | referral_code | low | miniapp |
| miniapp.server_selected | Server selected | User picks server | server_id | — | low | miniapp |
| miniapp.config_downloaded | Config downloaded | Download or QR | device_id | delivery_method | low | miniapp |
| miniapp.vpn_connected_hint_viewed | Connection hint shown | User saw connect hint | — | — | low | miniapp |
| miniapp.error_shown | Error UI shown | Error boundary or toast | message (truncated) | error_code | low | miniapp |
| miniapp.onboarding_started | Onboarding started | Onboarding flow begins | — | entry_state | low | miniapp |
| miniapp.onboarding_step_viewed | Onboarding step viewed | Step visible | step | step_order | low | miniapp |
| miniapp.onboarding_step_completed | Onboarding step done | Step completed | step | delivery_method | low | miniapp |
| miniapp.onboarding_abandoned | Onboarding abandoned | User left flow | — | last_step | low | miniapp |
| miniapp.connect_confirmed | Connection confirmed | User confirmed connect | device_id | handshake_detected | low | miniapp |
| miniapp.device_issue_started | Device issue started | Issue flow begins | — | platform | low | miniapp |
| miniapp.device_issue_success | Device issued | Config generated | device_id | server_id | low | miniapp |
| miniapp.device_revoked | Device revoked | User revoked device | device_id | reason | low | miniapp |
| miniapp.server_switched | Server switched | User changed server | device_id | from_server_id, to_server_id | low | miniapp |
| miniapp.cancel_flow_started | Cancel flow started | User started cancel | — | subscription_status | low | miniapp |
| miniapp.cancel_reason_selected | Cancel reason selected | User picked reason | reason_group | reason_code | low | miniapp |
| miniapp.retention_offer_shown | Retention offer shown | Offer displayed | — | offer_type | low | miniapp |
| miniapp.pause_selected | Pause selected | User selected pause | — | reason | low | miniapp |
| miniapp.web_vital | Web Vitals | Performance metric | name, value, unit | route | low | miniapp |

### 3.2 admin.*

| Event | Purpose | Trigger | Required Props | Optional Props | Privacy | Source |
|-------|---------|---------|----------------|----------------|---------|--------|
| admin.login_succeeded | Admin login success | JWT issued | — | — | low | admin |
| admin.login_failed | Admin login failed | Invalid credentials | — | reason | low | admin |
| admin.dashboard_viewed | Dashboard viewed | Dashboard route | — | — | low | admin |
| admin.user_viewed | User detail viewed | User page | user_id | — | low | admin |
| admin.node_viewed | Node/VPN node viewed | Node detail page | node_id | — | low | admin |
| admin.node_created | Node created | New node saved | node_id | — | low | admin |
| admin.node_updated | Node updated | Node edited | node_id | — | low | admin |
| admin.node_disabled | Node disabled | Node disabled | node_id | — | low | admin |
| admin.subscription_updated | Subscription updated | Admin changed sub | user_id, subscription_id | — | medium | admin |
| admin.broadcast_sent | Broadcast sent | Broadcast triggered | — | channel | low | admin |
| admin.filter_applied | Filter applied | Table/list filter | table, filter_keys | — | low | admin |
| admin.export_triggered | Export triggered | Export action | table | format | low | admin |
| admin.error_shown | Error UI shown | Error boundary or toast | message (truncated) | error_code | low | admin |
| admin.page_view | Page viewed | Route change | route | — | low | admin |
| admin.user_action | Generic user action | Action taken | action | entity_type, entity_id | low | admin |
| admin.web_vital | Web Vitals | Performance metric | name, value, unit | route | low | admin |

### 3.3 api.*

| Event | Purpose | Trigger | Required Props | Optional Props | Privacy | Source |
|-------|---------|---------|----------------|----------------|---------|--------|
| api.request_completed | Request completed | HTTP response | method, path_template, status_code | duration_ms | low | admin-api |
| api.request_failed | Request failed | 5xx or timeout | method, path_template, status_code | error_code | low | admin-api |

### 3.4 auth.*

| Event | Purpose | Trigger | Required Props | Optional Props | Privacy | Source |
|-------|---------|---------|----------------|----------------|---------|--------|
| auth.telegram_initdata_validated | Init data valid | Backend validated | — | — | low | admin-api |
| auth.telegram_initdata_rejected | Init data rejected | Validation failed | — | reason | low | admin-api |

### 3.5 billing.*

| Event | Purpose | Trigger | Required Props | Optional Props | Privacy | Source |
|-------|---------|---------|----------------|----------------|---------|--------|
| billing.invoice_created | Invoice created | Invoice generated | plan_id | payment_id | low | admin-api |
| billing.payment_confirmed | Payment confirmed | Webhook processed | plan_id, payment_id | amount | medium | admin-api |
| billing.payment_failed | Payment failed | Webhook or client | plan_id | reason | low | admin-api |

### 3.6 referral.*

| Event | Purpose | Trigger | Required Props | Optional Props | Privacy | Source |
|-------|---------|---------|----------------|----------------|---------|--------|
| referral.attach_attempted | Attach attempted | Backend received | — | referral_code | low | admin-api |
| referral.attach_succeeded | Attach succeeded | Referral linked | user_id | referral_code (hashed) | low | admin-api |
| referral.attach_failed | Attach failed | Attach rejected | — | reason | low | admin-api |

### 3.7 vpn.*

| Event | Purpose | Trigger | Required Props | Optional Props | Privacy | Source |
|-------|---------|---------|----------------|----------------|---------|--------|
| vpn.key_issued | VPN key issued | Peer added | device_id, server_id | — | low | admin-api |
| vpn.key_revoked | VPN key revoked | Peer removed | device_id, server_id | — | low | admin-api |
| vpn.node_health_changed | Node health changed | Health transition | node_id | status | low | worker |

### 3.8 system.*

| Event | Purpose | Trigger | Required Props | Optional Props | Privacy | Source |
|-------|---------|---------|----------------|----------------|---------|--------|
| system.worker_started | Worker started | Worker process up | — | — | low | worker |
| system.health_check | Health check | Periodic check | service | status | low | admin-api |

---

## 4. Legacy Event Mapping

Map existing `WebappTelemetryEventType` to `miniapp.*`:

| Legacy | Canonical |
|--------|-----------|
| app_open | miniapp.opened |
| screen_view | miniapp.page_view |
| cta_click | miniapp.cta_clicked |
| plan_selected | miniapp.plan_selected |
| checkout_started | miniapp.checkout_started |
| checkout_viewed | miniapp.checkout_viewed |
| payment_success | miniapp.payment_succeeded |
| payment_fail | miniapp.payment_failed |
| restore_access_started | miniapp.restore_access_started |
| restore_access_succeeded | miniapp.restore_access_succeeded |
| restore_access_failed | miniapp.restore_access_failed |
| referral_detected | miniapp.referral_detected |
| referral_attach_started | miniapp.referral_attach_started |
| referral_attach_succeeded | miniapp.referral_attach_succeeded |
| referral_attach_failed | miniapp.referral_attach_failed |
| device_limit_reached | miniapp.device_limit_reached |
| config_download | miniapp.config_downloaded |
| device_issue_success | miniapp.device_issue_success |
| device_revoked | miniapp.device_revoked |
| server_switched | miniapp.server_switched |
| support_opened | miniapp.support_opened |
| web_vital | miniapp.web_vital |

---

## 5. Owner / Team

| Namespace | Owner |
|-----------|-------|
| miniapp | Product / Growth |
| admin | Ops / Platform |
| api, auth, billing, referral, vpn | Backend / Platform |
| system | Platform / SRE |
