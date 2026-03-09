# Promo Code System Audit

## DB Schema (Current State)

### promo_codes (migration 009)
| Column      | Type            | Status |
|-------------|-----------------|--------|
| id          | String(32) PK   | OK     |
| code        | String(64) UNIQUE| OK (case-sensitive) |
| type        | String(32)      | OK     |
| value       | Numeric(12,2)   | OK     |
| constraints | JSONB           | OK     |
| status      | String(32)      | OK     |
| created_by  | BigInteger      | OK     |
| updated_by  | BigInteger      | OK     |
| created_at  | Timestamptz     | OK     |
| updated_at  | Timestamptz     | OK     |

**Missing columns:** discount_xtr, max_uses_per_user, global_use_limit, is_active, expires_at, applicable_plan_ids. Code stored as-is (no uppercase normalization).

### promo_redemptions
| Column        | Type            | Status |
|---------------|-----------------|--------|
| id            | String(32) PK   | OK     |
| promo_code_id | String(32) FK   | OK     |
| user_id       | BigInteger FK   | OK     |
| payment_id    | String(32) FK   | nullable (spec: NOT NULL) |
| subscription_id | String(32)    | OK     |
| redeemed_at   | Timestamptz     | OK     |

**Missing:** discount_applied_xtr, UNIQUE(promo_code_id, user_id). payment_id nullable.

---

## Endpoint Inventory

| Path | Status | Notes |
|------|--------|-------|
| POST /api/v1/webapp/promo/validate | Incomplete | Returns type/value/description; no discount_xtr, discounted_price_xtr, display_label; 404/400 instead of 422; no rate limit; case-sensitive lookup |
| POST /api/v1/webapp/payments/create-invoice | Partial | Accepts promo_code, stores in webhook_payload; does NOT apply discount to star_count |

---

## Redemption Atomicity

- **Current:** Promo applied in payment_webhook_service after payment. Invoice uses full plan price. No discount on payment amount.
- **Spec:** Redeem before payment; discount applied to invoice; atomic redeem+payment.
- **Result:** No (not atomic with payment creation; discount not applied to invoice)

---

## Per-User Idempotency

- **DB constraint:** Missing UNIQUE(promo_code_id, user_id)
- **App-level:** Exists in validate and webhook; race condition possible

---

## Frontend

| Component/Hook | Exists | Notes |
|----------------|--------|-------|
| PromoCodeInput | Yes | Input + Apply |
| promoCode state | Yes | In useCheckoutPageModel |
| promoStatus | No | idle/validating/valid/invalid |
| PromoErrorCode | No | Machine-readable error type |
| discountXtr, discountedPriceXtr, displayLabel | No | |
| handlePromoRemove | No | handlePromoRecovery partially covers |
| PriceSummary with strikethrough | No | |
| Error mapping per spec | Partial | Different strings |

---

## Gap List

1. **[SCHEMA]** promo_codes: add discount_xtr, max_uses_per_user, global_use_limit, is_active, expires_at, applicable_plan_ids; normalize code to uppercase
2. **[SCHEMA]** promo_redemptions: add discount_applied_xtr, UNIQUE(promo_code_id, user_id); payment_id NOT NULL for new redemptions
3. **[BACKEND]** promo_service.py: validate_promo_code, redeem_promo_code, PromoCodeError/PromoErrorCode
4. **[BACKEND]** Wire redeem into create-invoice before creating payment; apply discount to star_count
5. **[BACKEND]** POST /promo/validate: 422 with error_code; success with discount_xtr/discounted_price_xtr/display_label; rate limit 10/min/user
6. **[BACKEND]** Case-insensitive lookup (normalize code to uppercase)
7. **[FRONTEND]** useCheckoutPageModel: add promoStatus, PromoErrorCode, discountXtr, discountedPriceXtr, displayLabel, handlePromoRemove
8. **[FRONTEND]** Checkout: PriceSummary with strikethrough; error mapping per spec; success badge + Remove
9. **[SEED]** Insert 1freestar promo code
