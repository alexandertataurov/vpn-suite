export type MockEndpoint =
  | "me"
  | "access"
  | "logout"
  | "plans"
  | "servers"
  | "usage"
  | "billingHistory"
  | "referralLink"
  | "referralStats"
  | "supportFaq"
  | "subscriptionOffers"
  | "promoValidate"
  | "createInvoice"
  | "paymentStatus";

export type MockScenario = {
  token?: string | null;
  responses?: Partial<Record<MockEndpoint, unknown>>;
  statuses?: Partial<Record<MockEndpoint, number>>;
  loading?: MockEndpoint[];
};

export const pageStoryParameters = {
  layout: "fullscreen" as const,
  viewport: { defaultViewport: "mobile390" as const },
  status: { type: "stable" as const },
};
