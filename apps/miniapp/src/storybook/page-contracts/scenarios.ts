import type { MockScenario } from "./types";
import {
  accessExpiring,
  accessExpired,
  accessNoDevices,
  accessNoPlan,
  accessReady,
  accessTrialEnding,
  activePlans,
  activeSession,
  activeServers,
  activeUsage,
  billingHistory,
  createInvoice,
  emptyDevicesSession,
  expiredHomeSession,
  limitReachedSession,
  noPlanSession,
  paymentStatus,
  promoValidate,
  referralLink,
  referralStatsActive,
  subscriptionOffers,
  trialEndingSession,
} from "./responseBodies";

export const readyScenario: MockScenario = {
  token: "storybook-token",
  responses: {
    me: activeSession,
    access: accessReady,
    plans: activePlans,
    servers: activeServers,
    usage: activeUsage,
    billingHistory,
    referralLink,
    referralStats: referralStatsActive,
    subscriptionOffers,
    promoValidate,
    createInvoice,
    paymentStatus,
  },
};

export const trialScenario: MockScenario = {
  ...readyScenario,
  responses: {
    ...readyScenario.responses,
    me: trialEndingSession,
    access: accessTrialEnding,
  },
};

export const expiredScenario: MockScenario = {
  ...readyScenario,
  responses: {
    ...readyScenario.responses,
    me: expiredHomeSession,
    access: accessExpired,
  },
};

export const noPlanScenario: MockScenario = {
  ...readyScenario,
  responses: {
    ...readyScenario.responses,
    me: noPlanSession,
    access: accessNoPlan,
  },
};

export const emptyDevicesScenario: MockScenario = {
  ...readyScenario,
  responses: {
    ...readyScenario.responses,
    me: emptyDevicesSession,
    access: accessNoDevices,
  },
};

export const limitReachedScenario: MockScenario = {
  ...readyScenario,
  responses: {
    ...readyScenario.responses,
    me: limitReachedSession,
  },
};

export const loadingCheckoutScenario: MockScenario = {
  ...readyScenario,
  loading: ["plans"],
};

export const loadingSessionScenario: MockScenario = {
  ...readyScenario,
  loading: ["me", "access"],
};

export const loggedOutScenario: MockScenario = {
  token: null,
  responses: {},
};

export const failureScenario: MockScenario = {
  ...readyScenario,
  statuses: {
    me: 500,
  },
};

export const expiringNoDevicesScenario: MockScenario = {
  ...readyScenario,
  responses: {
    ...readyScenario.responses,
    access: accessExpiring,
  },
};

export const accessErrorScenario: MockScenario = {
  ...readyScenario,
  statuses: {
    access: 500,
  },
};

export const restoreScenario: MockScenario = expiredScenario;

const longNameSession = {
  ...activeSession,
  user: {
    ...activeSession.user,
    display_name: "Alexandra Maria Consuelo Rodriguez-Garcia de la Vega III",
    email: "alexandra.rodriguez.garcia@example.org",
  },
};

export const longNameScenario: MockScenario = {
  ...readyScenario,
  responses: {
    ...readyScenario.responses,
    me: longNameSession,
  },
};

const expiringSoonSession = {
  ...activeSession,
  subscriptions: [
    {
      ...activeSession.subscriptions[0],
      valid_until: "2026-03-25T12:00:00Z",
      trial_ends_at: "2026-03-25T12:00:00Z",
    },
  ],
};

export const expiringSoonScenario: MockScenario = {
  ...readyScenario,
  responses: {
    ...readyScenario.responses,
    me: expiringSoonSession,
  },
};
