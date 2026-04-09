# Support & Save Playbook v1

**Status:** Proposed  
**Audience:** Support, Ops, Product, Growth, Admin, Backend

---

## 1. Purpose

This playbook defines how support should handle activation blockers, billing confusion, performance complaints, device-limit issues, and churn-risk conversations.

Support should not act like a passive ticket graveyard. It is a recovery engine.

---

## 2. Support objectives

- restore user connection fast,
- reduce repeat contact,
- route true bugs to product/backend with evidence,
- identify churn-risk early,
- trigger save offers only when appropriate,
- log structured outcomes for analytics.

---

## 3. Required admin context

Support/admin screen must show:
- user lifecycle stage,
- subscription/access/billing state,
- current and previous plan,
- invoice history,
- grace status,
- device list and last handshakes,
- server assignment and last switches,
- recent offers shown/accepted,
- recent CRM messages sent,
- referral/promo flags,
- support history and root cause tags.

---

## 4. Triage classes

| Class | Definition | First action |
|---|---|---|
| Activation blocker | paid/trial user cannot connect first device | setup rescue |
| Recurrent connectivity | previously active user keeps disconnecting | inspect server/device health |
| Billing confusion | user does not understand charge/state | explain ledger and state |
| Payment failure | renewal or purchase failed | recovery path |
| Device slot issue | cannot add device | revoke/replace/upgrade |
| Speed/performance | slow or unstable route | switch region/server then investigate |
| Cancel risk | user expresses desire to leave | reason capture + save logic |
| Abuse/fraud | suspicious referrals/payments | escalate to risk/manual review |

---

## 5. Resolution sequences

### 5.1 Activation blocker
1. Verify entitlement exists and access is enabled.
2. Check device issuance and config timestamp.
3. Confirm client type and install path.
4. Trigger reissue / refreshed QR if needed.
5. Offer direct setup steps matching platform.
6. If still failing, inspect node/server health.
7. Escalate with structured log if unresolved.

### 5.2 Billing confusion
1. Show current plan, next renewal, invoice status, and recent payment history.
2. Explain whether issue is billing, access, or grace.
3. If duplicate or inconsistent states exist, escalate to finance/backend.
4. If price sensitivity is root cause, route to save flow after issue clarity.

### 5.3 Device limit issue
1. Show current devices and activity.
2. Offer replace-old-device path.
3. Offer upgrade if user needs concurrent access.
4. Record whether issue was operational or upsell-driven.

### 5.4 Speed complaint
1. Check recent server and last handshake quality.
2. Suggest best available region or route class.
3. Reissue config only if needed.
4. Do not push premium tier before basic routing issue has been addressed.

### 5.5 Cancel risk
1. Capture structured reason.
2. Confirm whether issue is technical, price, or usage-based.
3. Attempt resolution first for technical complaints.
4. Offer pause/downgrade/discount according to rules.
5. Finalize state cleanly if user still cancels.

---

## 6. Save offer guardrails

Support may surface save offers only when:
- reason is clearly tagged,
- user is eligible by offer rules,
- there is no unresolved high-severity technical issue,
- no stronger overlapping offer exists in cooldown window.

Support must not:
- invent ad hoc discounts,
- promise features that do not exist,
- hide cancellation,
- apply contradictory manual state changes outside policy.

---

## 7. Mandatory outcome tags

Every support case must end with:
- root cause category,
- resolution status,
- save-eligible yes/no,
- save offer shown yes/no,
- save outcome,
- follow-up required yes/no,
- bug/escalation link if applicable.

---

## 8. Escalation rules

Escalate immediately when:
- payment completed but entitlement missing,
- repeated entitlement duplication,
- widespread server issue,
- referral abuse pattern,
- finance mismatch above threshold,
- legal/security concern.

---

## 9. Quality KPIs

- first response time,
- first contact resolution,
- activation rescue success,
- repeat contact rate,
- support-driven save rate,
- bug report acceptance rate,
- CSAT if collected later.
