/** Machine-readable promo validation error codes. Map to display strings in Checkout.tsx. */
export type PromoErrorCode =
  | "PROMO_NOT_FOUND"
  | "PROMO_INACTIVE"
  | "PROMO_EXPIRED"
  | "PROMO_PLAN_INELIGIBLE"
  | "PROMO_ALREADY_USED"
  | "PROMO_EXHAUSTED";
