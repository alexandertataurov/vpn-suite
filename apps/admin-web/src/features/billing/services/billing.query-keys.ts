export const billingKeys = {
  all: ["billing"] as const,
  plans: () => [...billingKeys.all, "plans"] as const,
  payments: (params?: { user_id?: string; status?: string; provider?: string; limit?: number; offset?: number }) =>
    [...billingKeys.all, "payments", params ?? {}] as const,
  subscriptions: (params?: { user_id?: string; plan_id?: string; limit?: number; offset?: number }) =>
    [...billingKeys.all, "subscriptions", params ?? {}] as const,
  entitlementEvents: (params: { user_id?: number | string; subscription_id?: string; event_type?: string; limit?: number }) =>
    [...billingKeys.all, "entitlement-events", params] as const,
  churnSurveys: (params?: { user_id?: string; subscription_id?: string; limit?: number; offset?: number }) =>
    [...billingKeys.all, "churn-surveys", params ?? {}] as const,
};

