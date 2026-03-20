export const webappQueryKeys = {
  all: ["webapp"] as const,
  access: () => [...webappQueryKeys.all, "user", "access"] as const,
  me: () => [...webappQueryKeys.all, "me"] as const,
  healthReady: () => [...webappQueryKeys.all, "health", "ready"] as const,
  servers: () => [...webappQueryKeys.all, "servers"] as const,
  usage: (range: string) => [...webappQueryKeys.all, "usage", range] as const,
  plans: () => [...webappQueryKeys.all, "plans"] as const,
  /** Prefix for invalidating all subscription-offers caches (any reason_group). */
  subscriptionOffersRoot: () => [...webappQueryKeys.all, "subscription", "offers"] as const,
  subscriptionOffers: (reason_group?: string | null) =>
    [...webappQueryKeys.subscriptionOffersRoot(), reason_group ?? ""] as const,
  paymentsHistoryRoot: () => [...webappQueryKeys.all, "payments", "history"] as const,
  paymentsHistory: (limit: number) => [...webappQueryKeys.paymentsHistoryRoot(), limit] as const,
  referralLink: () => [...webappQueryKeys.all, "referral", "link"] as const,
  referralStats: () => [...webappQueryKeys.all, "referral", "stats"] as const,
  supportFaq: () => [...webappQueryKeys.all, "support", "faq"] as const,
};

