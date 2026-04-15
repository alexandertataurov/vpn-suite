import { useEffect, useMemo, type ReactNode } from "react";
import {
  accessExpired,
  accessNoDevices,
  accessNoPlan,
  accessReady,
  activePlans,
  activeServers,
  activeSession,
  activeUsage,
  billingHistory,
  createInvoice,
  emptyDevicesSession,
  expiredSession,
  limitReachedSession,
  noPlanSession,
  promoValidate,
  referralLink,
  referralStatsActive,
  subscriptionOffers,
  supportFaqDefault,
} from "@/features/mock/mirrorFixtures";
import { setWebappToken } from "@/api/client";

const MOCK_TOKEN = "mock-mirror-token";
const MIRROR_PREFIX = "/mock/mirror";

type MirrorScenario = "default" | "no_plan" | "expired" | "device_limit" | "no_devices" | "faq_offline";

type MutableOnboardingState = {
  completed: boolean;
  step: number;
  version: number;
  updated_at: string | null;
};

function getRequestInfo(input: RequestInfo | URL, init?: RequestInit): { url: string; method: string } {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  const method =
    (
      init?.method ??
      (typeof input === "object" && "method" in input ? input.method : "GET")
    ).toUpperCase();
  return { url, method };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseBody(init?: RequestInit): Record<string, unknown> {
  if (!init?.body || typeof init.body !== "string") return {};
  try {
    return JSON.parse(init.body) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function toIsoNow(): string {
  return new Date().toISOString();
}

function isMirrorRequest(url: string): boolean {
  return url.includes("/webapp/");
}

function getCurrentScenario(): MirrorScenario {
  const search = new URLSearchParams(window.location.search);
  const raw = search.get("scenario");
  switch (raw) {
    case "no_plan":
    case "expired":
    case "device_limit":
    case "no_devices":
    case "faq_offline":
      return raw;
    default:
      return "default";
  }
}

function getScenarioData(scenario: MirrorScenario) {
  if (scenario === "no_plan") {
    return {
      me: noPlanSession,
      access: accessNoPlan,
      supportFaqStatus: 200,
    };
  }
  if (scenario === "expired") {
    return {
      me: expiredSession,
      access: accessExpired,
      supportFaqStatus: 200,
    };
  }
  if (scenario === "device_limit") {
    return {
      me: limitReachedSession,
      access: accessReady,
      supportFaqStatus: 200,
    };
  }
  if (scenario === "no_devices") {
    return {
      me: emptyDevicesSession,
      access: accessNoDevices,
      supportFaqStatus: 200,
    };
  }
  if (scenario === "faq_offline") {
    return {
      me: activeSession,
      access: accessReady,
      supportFaqStatus: 503,
    };
  }
  return {
    me: activeSession,
    access: accessReady,
    supportFaqStatus: 200,
  };
}

function mapAppPathToMirror(pathname: string, search: string): string {
  if (!pathname.startsWith("/")) return pathname;
  const normalizedPathname =
    pathname === "/webapp"
      ? "/"
      : pathname.startsWith("/webapp/")
        ? pathname.replace(/^\/webapp/, "")
        : pathname;
  if (normalizedPathname.startsWith(`${MIRROR_PREFIX}/`) || normalizedPathname === MIRROR_PREFIX) {
    return `${normalizedPathname}${search}`;
  }
  if (normalizedPathname.startsWith("/mock/")) return `${normalizedPathname}${search}`;

  if (normalizedPathname === "/") return `${MIRROR_PREFIX}/home${search}`;
  if (normalizedPathname === "/onboarding") return `${MIRROR_PREFIX}/onboarding${search}`;
  if (normalizedPathname === "/plan") return `${MIRROR_PREFIX}/plan${search}`;
  if (normalizedPathname.startsWith("/plan/checkout/")) return `${MIRROR_PREFIX}${normalizedPathname}${search}`;
  if (normalizedPathname === "/devices" || normalizedPathname === "/devices/issue") {
    return `${MIRROR_PREFIX}/devices${search}`;
  }
  if (normalizedPathname === "/settings") return `${MIRROR_PREFIX}/settings${search}`;
  if (normalizedPathname === "/support") return `${MIRROR_PREFIX}/support${search}`;
  if (normalizedPathname === "/setup-guide") return `${MIRROR_PREFIX}/setup-guide${search}`;
  if (normalizedPathname === "/connect-status") return `${MIRROR_PREFIX}/connect-status${search}`;
  if (normalizedPathname === "/restore-access") return `${MIRROR_PREFIX}/restore-access${search}`;
  if (normalizedPathname === "/referral") return `${MIRROR_PREFIX}/referral${search}`;
  if (normalizedPathname === "/servers") return `${MIRROR_PREFIX}/home${search}`;
  if (normalizedPathname === "/account/subscription") return `${MIRROR_PREFIX}/plan${search}`;
  return `${normalizedPathname}${search}`;
}

function rewriteUrlIfNeeded(input: string | URL | null | undefined): string | URL | null | undefined {
  if (!input) return input;
  const currentSearch = window.location.search;

  if (typeof input === "string") {
    if (/^https?:\/\//.test(input)) return input;
    if (!input.startsWith("/")) return input;
    const asUrl = new URL(input, window.location.origin);
    const rewritten = mapAppPathToMirror(asUrl.pathname, asUrl.search || currentSearch);
    return rewritten;
  }

  const rewritten = mapAppPathToMirror(input.pathname, input.search || currentSearch);
  return new URL(rewritten, window.location.origin);
}

export function MockMirrorProvider({ children }: { children: ReactNode }) {
  const scenarioData = useMemo(() => getScenarioData(getCurrentScenario()), []);

  useEffect(() => {
    setWebappToken(MOCK_TOKEN);

    const originalFetch = window.fetch.bind(window);
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);
    const onboardingState: MutableOnboardingState = {
      completed: true,
      step: 3,
      version: 2,
      updated_at: toIsoNow(),
    };

    window.history.pushState = (data: unknown, unused: string, url?: string | URL | null) =>
      originalPushState(data, unused, rewriteUrlIfNeeded(url));
    window.history.replaceState = (data: unknown, unused: string, url?: string | URL | null) =>
      originalReplaceState(data, unused, rewriteUrlIfNeeded(url));

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const { url, method } = getRequestInfo(input, init);
      if (!isMirrorRequest(url)) {
        return originalFetch(input, init);
      }

      const body = parseBody(init);

      if (method === "GET" && url.includes("/webapp/me")) {
        return jsonResponse(scenarioData.me);
      }
      if (method === "GET" && url.includes("/webapp/user/access")) {
        return jsonResponse(scenarioData.access);
      }
      if (method === "GET" && url.includes("/webapp/plans")) {
        return jsonResponse(activePlans);
      }
      if (method === "GET" && url.includes("/webapp/servers")) {
        return jsonResponse(activeServers);
      }
      if (method === "GET" && url.includes("/webapp/usage")) {
        return jsonResponse(activeUsage);
      }
      if (method === "GET" && url.includes("/webapp/payments/history")) {
        return jsonResponse(billingHistory);
      }
      if (method === "GET" && url.includes("/webapp/referral/my-link")) {
        return jsonResponse(referralLink);
      }
      if (method === "GET" && url.includes("/webapp/referral/stats")) {
        return jsonResponse(referralStatsActive);
      }
      if (method === "GET" && url.includes("/webapp/support/faq")) {
        if (scenarioData.supportFaqStatus >= 400) {
          return jsonResponse({ error: { message: "Mock FAQ unavailable" } }, scenarioData.supportFaqStatus);
        }
        return jsonResponse(supportFaqDefault);
      }
      if (method === "GET" && /\/webapp\/payments\/.+\/status/.test(url)) {
        return jsonResponse({ status: "completed" });
      }
      if (method === "GET" && url.includes("/webapp/subscription/offers")) {
        return jsonResponse(subscriptionOffers);
      }

      if (method === "POST" && url.includes("/webapp/promo/validate")) {
        return jsonResponse(promoValidate);
      }
      if (method === "POST" && url.includes("/webapp/payments/create-invoice")) {
        return jsonResponse(createInvoice);
      }
      if (method === "POST" && url.includes("/webapp/subscription/restore")) {
        return jsonResponse({ status: "ok", plan_id: "pro-annual", redirect_to: "/plan/checkout/pro-annual" });
      }
      if (method === "POST" && url.includes("/webapp/onboarding/state")) {
        if (typeof body.step === "number") onboardingState.step = Math.max(0, body.step);
        if (typeof body.completed === "boolean") onboardingState.completed = body.completed;
        onboardingState.updated_at = toIsoNow();
        return jsonResponse(onboardingState);
      }
      if (method === "POST" && url.includes("/webapp/devices/issue")) {
        return jsonResponse({
          status: "ok",
          device_id: "dev-issued-mock",
          device_name: "Mock Device",
          peer_created: true,
          config_awg: "vpn://mock-issued-device-config",
          config_wg: "[Interface]\nPrivateKey = ***\nAddress = 10.0.0.2/32",
        });
      }
      if (method === "POST" && /\/webapp\/devices\/.+\/replace-with-new/.test(url)) {
        return jsonResponse({
          status: "ok",
          device_id: "dev-replaced-mock",
          device_name: "Mock Replacement Device",
          peer_created: true,
          config_awg: "vpn://mock-replaced-device-config",
          config_wg: "[Interface]\nPrivateKey = ***\nAddress = 10.0.0.3/32",
        });
      }

      if (method === "POST" && url.includes("/webapp/telemetry")) {
        return jsonResponse({ status: "ok" });
      }
      if (method === "POST" && url.includes("/webapp/logout")) {
        return jsonResponse({ status: "ok" });
      }
      if (method === "POST" && url.includes("/webapp/subscription/pause")) {
        return jsonResponse({ ...subscriptionOffers, can_pause: false, can_resume: true });
      }
      if (method === "POST" && url.includes("/webapp/subscription/resume")) {
        return jsonResponse({ ...subscriptionOffers, can_pause: true, can_resume: false });
      }
      if (method === "POST" && url.includes("/webapp/subscription/cancel")) {
        return jsonResponse({ status: "ok" });
      }
      if (method === "POST" && /\/webapp\/devices\/.+\/(confirm-connected|revoke)/.test(url)) {
        return jsonResponse({ status: "ok" });
      }

      if (method === "PATCH" && /\/webapp\/devices\/.+/.test(url)) {
        return jsonResponse({ status: "ok" });
      }
      if (method === "PATCH" && url.includes("/webapp/me")) {
        return jsonResponse({ status: "ok" });
      }
      if (method === "DELETE" && url.includes("/webapp/me")) {
        return jsonResponse(null, 200);
      }

      return jsonResponse({ status: "ok" });
    };

    return () => {
      window.fetch = originalFetch;
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      setWebappToken(null);
    };
  }, [scenarioData]);

  return <>{children}</>;
}
