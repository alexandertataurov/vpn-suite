import { useEffect, useLayoutEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setWebappToken } from "@/api/client";
import { BootstrapContextProvider } from "@/bootstrap";
import { ToastContainer } from "@/design-system";
import { ViewportShellRoutes } from "./withViewportShell";
import { OnboardingPage } from "@/pages/Onboarding";
import { PlanPage } from "@/pages/Plan";

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

const activePlans = {
  items: [
    {
      id: "pro-monthly",
      name: "Pro Monthly",
      duration_days: 30,
      device_limit: 3,
      price_amount: 9,
      price_currency: "XTR",
      style: "normal",
      upsell_methods: ["expiry", "device_limit", "referral"],
      display_order: 1,
    },
    {
      id: "pro-annual",
      name: "Pro Annual",
      duration_days: 365,
      device_limit: 5,
      price_amount: 79,
      price_currency: "XTR",
      style: "popular",
      upsell_methods: ["expiry", "device_limit", "referral"],
      display_order: 2,
    },
    {
      id: "pro-lifetime",
      name: "Pro Lifetime",
      duration_days: 3650,
      device_limit: 10,
      price_amount: 199,
      price_currency: "XTR",
      style: "promotional",
      upsell_methods: ["device_limit", "referral"],
      display_order: 3,
    },
  ],
};

const activeSession = {
  user: {
    id: 42,
    tg_id: 4242,
    display_name: "Alex Morgan",
    email: "alex@vpn.example",
    phone: "+1 555 0100",
    locale: "en",
    first_connected_at: "2025-11-03T10:00:00Z",
  },
  subscriptions: [
    {
      id: "sub-active",
      plan_id: "pro-monthly",
      status: "active",
      subscription_status: "active",
      access_status: "enabled",
      valid_until: "2026-03-24T12:00:00Z",
      trial_ends_at: "2026-03-24T12:00:00Z",
      is_trial: false,
      auto_renew: true,
      device_limit: 3,
    },
  ],
  devices: [
    {
      id: "dev-mac-active",
      device_name: "MacBook Pro",
      issued_at: "2026-02-10T08:12:00Z",
      last_seen_handshake_at: "2026-03-10T10:10:00Z",
      confirmed_connected_at: "2026-03-10T10:11:00Z",
      status: "connected",
      revoked_at: null,
    },
    {
      id: "dev-phone-ready",
      device_name: "iPhone 15 Pro",
      issued_at: "2026-03-06T09:42:00Z",
      last_seen_handshake_at: "2026-03-10T09:50:00Z",
      confirmed_connected_at: null,
      status: "config_pending",
      revoked_at: null,
    },
  ],
  public_ip: "185.199.110.42",
  latest_device_delivery: {
    device_id: "dev-mac-active",
    device_name: "MacBook Pro",
    issued_at: "2026-02-10T08:12:00Z",
    amnezia_vpn_key: "vpn://storybook-amnezia-key",
  },
  routing: {
    recommended_route: "/",
    reason: "connected_user",
  },
  onboarding: {
    completed: true,
    step: 3,
    version: 2,
    updated_at: "2026-03-01T00:00:00Z",
  },
};

const trialEndingSession = {
  ...activeSession,
  subscriptions: [
    {
      ...activeSession.subscriptions[0],
      id: "sub-trial",
      is_trial: true,
      auto_renew: false,
      access_status: "enabled",
      valid_until: "2026-03-13T12:00:00Z",
      trial_ends_at: "2026-03-13T12:00:00Z",
      device_limit: 2,
    },
  ],
};

const expiredHomeSession = {
  ...activeSession,
  subscriptions: [
    {
      ...activeSession.subscriptions[0],
      id: "sub-expired-home",
      plan_id: "pro-annual",
      status: "expired",
      subscription_status: "expired",
      access_status: "grace",
      auto_renew: false,
      valid_until: "2026-03-05T12:00:00Z",
      device_limit: 5,
    },
  ],
  routing: {
    recommended_route: "/restore-access",
    reason: "expired_with_grace",
  },
};

const noPlanSession = {
  ...activeSession,
  subscriptions: [],
  devices: [],
  public_ip: null,
  routing: {
    recommended_route: "/plan",
    reason: "no_subscription",
  },
};

const emptyDevicesSession = {
  ...activeSession,
  devices: [],
};

const limitReachedSession = {
  ...activeSession,
  devices: [
    {
      id: "dev-1",
      device_name: "MacBook Pro",
      issued_at: "2026-02-10T08:12:00Z",
      last_seen_handshake_at: "2026-03-10T10:10:00Z",
      confirmed_connected_at: "2026-03-10T10:11:00Z",
      status: "connected",
      revoked_at: null,
    },
    {
      id: "dev-2",
      device_name: "Pixel 9",
      issued_at: "2026-02-18T11:00:00Z",
      last_seen_handshake_at: "2026-03-10T09:20:00Z",
      confirmed_connected_at: "2026-03-10T09:25:00Z",
      status: "active",
      revoked_at: null,
    },
    {
      id: "dev-3",
      device_name: "iPad Pro",
      issued_at: "2026-02-28T07:50:00Z",
      last_seen_handshake_at: "2026-03-09T21:02:00Z",
      confirmed_connected_at: "2026-03-09T21:10:00Z",
      status: "active",
      revoked_at: null,
    },
  ],
};

const activeServers = {
  auto_select: false,
  total: 3,
  items: [
    { id: "srv-amsterdam", name: "Amsterdam", region: "NL", avg_ping_ms: 41, load_percent: 28, is_recommended: true, is_current: true },
    { id: "srv-frankfurt", name: "Frankfurt", region: "DE", avg_ping_ms: 76, load_percent: 44, is_recommended: false, is_current: false },
    { id: "srv-paris", name: "Paris", region: "FR", avg_ping_ms: 132, load_percent: 62, is_recommended: false, is_current: false },
  ],
};

const activeUsage = {
  points: [
    { ts: "2026-03-04T00:00:00Z", bytes_in: 420_000_000, bytes_out: 140_000_000 },
    { ts: "2026-03-05T00:00:00Z", bytes_in: 380_000_000, bytes_out: 120_000_000 },
    { ts: "2026-03-06T00:00:00Z", bytes_in: 520_000_000, bytes_out: 160_000_000 },
    { ts: "2026-03-07T00:00:00Z", bytes_in: 610_000_000, bytes_out: 180_000_000 },
    { ts: "2026-03-08T00:00:00Z", bytes_in: 700_000_000, bytes_out: 240_000_000 },
    { ts: "2026-03-09T00:00:00Z", bytes_in: 760_000_000, bytes_out: 280_000_000 },
    { ts: "2026-03-10T00:00:00Z", bytes_in: 840_000_000, bytes_out: 320_000_000 },
  ],
  sessions: 7,
};

const billingHistory = {
  items: [
    {
      payment_id: "pay-1",
      created_at: "2026-02-20T11:00:00Z",
      amount: 79,
      status: "paid",
      plan_name: "Pro Annual",
      invoice_ref: "webapp:telegram_stars:inv-annual-20260220",
      plan_id: "pro-annual",
    },
    {
      payment_id: "pay-2",
      created_at: "2025-02-20T11:00:00Z",
      amount: 79,
      status: "paid",
      plan_name: "Pro Annual",
      invoice_ref: "webapp:telegram_stars:inv-annual-20250220",
      plan_id: "pro-annual",
    },
  ],
  total: 2,
};

const referralLink = {
  payload: "ref_abc123",
  bot_username: "vpn_suite_bot",
};

const referralStatsActive = {
  earned_days: 21,
  total_referrals: 4,
  pending_rewards: 1,
  active_referrals: 3,
  invite_goal: 5,
  invite_progress: 3,
  invite_remaining: 2,
};

const subscriptionOffers = {
  subscription_id: "sub-active",
  status: "active",
  valid_until: "2026-03-24T12:00:00Z",
  discount_percent: 20,
  can_pause: true,
  can_resume: false,
  offer_pause: true,
  offer_discount: true,
  offer_downgrade: false,
  reason_group: "not_needed",
};

const promoValidate = {
  valid: true,
  discount_xtr: 15,
  discounted_price_xtr: 64,
  display_label: "Promo applied",
};

const createInvoice = {
  payment_id: "invoice-1",
  invoice_link: "https://t.me/invoice/mock",
  invoice_url: "https://t.me/invoice/mock",
  star_count: 79,
  free_activation: false,
};

const paymentStatus = {
  status: "pending",
};

const accessReady: Record<string, unknown> = {
  status: "ready",
  has_plan: true,
  devices_used: 2,
  device_limit: 3,
  config_ready: true,
  config_id: "dev-mac-active",
  expires_at: "2026-03-24T12:00:00Z",
  amnezia_vpn_key: "vpn://storybook-amnezia-key",
};

const accessNoDevices: Record<string, unknown> = {
  ...accessReady,
  devices_used: 0,
  status: "needs_device",
};

const accessNoPlan: Record<string, unknown> = {
  status: "no_plan",
  has_plan: false,
  devices_used: 0,
  device_limit: null,
  config_ready: false,
  config_id: null,
  expires_at: null,
  amnezia_vpn_key: null,
};

const accessExpired: Record<string, unknown> = {
  status: "expired",
  has_plan: true,
  devices_used: 3,
  device_limit: 5,
  config_ready: false,
  config_id: null,
  expires_at: "2026-03-05T12:00:00Z",
  amnezia_vpn_key: null,
};

const accessTrialEnding: Record<string, unknown> = {
  ...accessReady,
  devices_used: 0,
  device_limit: 2,
  expires_at: "2026-03-13T12:00:00Z",
};

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

const accessExpiring: Record<string, unknown> = {
  ...accessReady,
  devices_used: 0,
  device_limit: 5,
  expires_at: "2026-03-25T12:00:00Z",
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

export function PageSandbox({
  children,
  scenario,
  initialEntries,
}: {
  children: ReactElement;
  scenario: MockScenario;
  initialEntries: string[];
}) {
  const [tokenReady, setTokenReady] = useState(false);
  const bootstrapValue = useMemo(
    () => ({
      phase: "app_ready" as const,
      onboardingStep: 0,
      onboardingVersion: 2,
      onboardingError: null,
      isCompletingOnboarding: false,
      setOnboardingStep: async () => undefined,
      completeOnboarding: async () => ({ done: true, synced: true }),
    }),
    [],
  );
  const client = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      }),
    [],
  );

  useLayoutEffect(() => {
    setWebappToken(scenario.token ?? null);
    setTokenReady(true);
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method ?? (typeof input === "object" && "method" in input ? input.method : "GET") ?? "GET").toUpperCase();
      const endpoint = resolveEndpoint(url, method);
      if (!endpoint) return originalFetch(input, init);
      if (scenario.loading?.includes(endpoint)) {
        return new Promise<Response>(() => undefined as never);
      }
      const status = scenario.statuses?.[endpoint] ?? 200;
      const body = scenario.responses?.[endpoint] ?? defaultResponse(endpoint);
      if (status >= 400) {
        return jsonResponse({ error: { message: "Mocked error" } }, status);
      }
      return jsonResponse(body, status);
    };

    return () => {
      window.fetch = originalFetch;
      setWebappToken(null);
      client.clear();
    };
  }, [client, scenario]);

  if (!tokenReady) return null;

  return (
    <QueryClientProvider client={client}>
      <ToastContainer>
        <BootstrapContextProvider value={bootstrapValue}>
          <ViewportShellRoutes initialEntries={initialEntries} variant="stack">
            {children}
          </ViewportShellRoutes>
        </BootstrapContextProvider>
      </ToastContainer>
    </QueryClientProvider>
  );
}

export function OnboardingSandbox({
  children,
  scenario,
  initialEntries,
}: {
  children: ReactNode;
  scenario: MockScenario;
  initialEntries: string[];
}) {
  const client = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      }),
    [],
  );

  useEffect(() => {
    setWebappToken(scenario.token ?? null);
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method ?? (typeof input === "object" && "method" in input ? input.method : "GET") ?? "GET").toUpperCase();
      const endpoint = resolveEndpoint(url, method);
      if (!endpoint) return originalFetch(input, init);
      if (scenario.loading?.includes(endpoint)) {
        return new Promise<Response>(() => undefined as never);
      }
      const status = scenario.statuses?.[endpoint] ?? 200;
      const body = scenario.responses?.[endpoint] ?? defaultResponse(endpoint);
      if (status >= 400) {
        return jsonResponse({ error: { message: "Mocked error" } }, status);
      }
      return jsonResponse(body, status);
    };

    return () => {
      window.fetch = originalFetch;
      setWebappToken(null);
      client.clear();
    };
  }, [client, scenario]);

  return (
    <QueryClientProvider client={client}>
      <ToastContainer>
        <ViewportShellRoutes initialEntries={initialEntries} variant="stack">
          {children}
        </ViewportShellRoutes>
      </ToastContainer>
    </QueryClientProvider>
  );
}

export function OnboardingStoryHarness({ step = 0 }: { step?: number }) {
  const [onboardingStep, setOnboardingStep] = useState(step);
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);

  const value = useMemo(
    () => ({
      phase: "onboarding" as const,
      onboardingStep,
      onboardingVersion: 2,
      onboardingError: null,
      isCompletingOnboarding,
      setOnboardingStep: async (nextStep: number) => {
        setOnboardingStep(nextStep);
      },
      completeOnboarding: async () => {
        setIsCompletingOnboarding(true);
        await Promise.resolve();
        setIsCompletingOnboarding(false);
        return { done: true, synced: true };
      },
    }),
    [isCompletingOnboarding, onboardingStep],
  );

  return (
    <ToastContainer>
      <BootstrapContextProvider value={value}>
        <OnboardingPage />
      </BootstrapContextProvider>
    </ToastContainer>
  );
}

export function PlanStoryHarness() {
  const value = useMemo(
    () => ({
      phase: "app_ready" as const,
      onboardingStep: 0,
      onboardingVersion: 2,
      onboardingError: null,
      isCompletingOnboarding: false,
      setOnboardingStep: async () => undefined,
      completeOnboarding: async () => ({ done: true, synced: true }),
    }),
    [],
  );

  return (
    <ToastContainer>
      <BootstrapContextProvider value={value}>
        <PlanPage />
      </BootstrapContextProvider>
    </ToastContainer>
  );
}

function resolveEndpoint(url: string, method: string): MockEndpoint | null {
  if (method === "GET" && url.includes("/webapp/me")) return "me";
  if (method === "GET" && url.includes("/webapp/user/access")) return "access";
  if (method === "POST" && url.includes("/webapp/logout")) return "logout";
  if (method === "GET" && url.includes("/webapp/plans")) return "plans";
  if (method === "GET" && url.includes("/webapp/servers")) return "servers";
  if (method === "GET" && url.includes("/webapp/usage")) return "usage";
  if (method === "GET" && url.includes("/webapp/payments/history")) return "billingHistory";
  if (method === "GET" && url.includes("/webapp/referral/my-link")) return "referralLink";
  if (method === "GET" && url.includes("/webapp/referral/stats")) return "referralStats";
  if (method === "GET" && url.includes("/webapp/subscription/offers")) return "subscriptionOffers";
  if (method === "POST" && url.includes("/webapp/promo/validate")) return "promoValidate";
  if (method === "POST" && url.includes("/webapp/payments/create-invoice")) return "createInvoice";
  if (method === "GET" && /\/webapp\/payments\/.+\/status/.test(url)) return "paymentStatus";
  if (method === "POST" && url.includes("/webapp/subscription/restore")) return "subscriptionOffers";
  if (method === "POST" && url.includes("/webapp/subscription/pause")) return "subscriptionOffers";
  if (method === "POST" && url.includes("/webapp/subscription/resume")) return "subscriptionOffers";
  if (method === "POST" && url.includes("/webapp/subscription/cancel")) return "subscriptionOffers";
  if (method === "POST" && url.includes("/webapp/servers/select")) return "servers";
  if ((method === "POST" || method === "PATCH" || method === "DELETE") && url.includes("/webapp/me")) return "me";
  if (method === "POST" && /\/webapp\/devices\/.+\/(replace-with-new|confirm-connected|revoke)/.test(url)) return "me";
  if (method === "POST" && url.includes("/webapp/devices/issue")) return "me";
  return null;
}

function defaultResponse(endpoint: MockEndpoint): unknown {
  switch (endpoint) {
    case "me":
      return activeSession;
    case "access":
      return accessReady;
    case "logout":
      return { status: "ok" };
    case "plans":
      return activePlans;
    case "servers":
      return activeServers;
    case "usage":
      return activeUsage;
    case "billingHistory":
      return billingHistory;
    case "referralLink":
      return referralLink;
    case "referralStats":
      return referralStatsActive;
    case "subscriptionOffers":
      return subscriptionOffers;
    case "promoValidate":
      return promoValidate;
    case "createInvoice":
      return createInvoice;
    case "paymentStatus":
      return paymentStatus;
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
