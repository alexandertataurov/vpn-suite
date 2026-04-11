import { useLayoutEffect } from "react";
import { setWebappToken } from "@/api/client";
import { createStorybookQueryClient } from "../queryClient";
import type { MockEndpoint, MockScenario } from "./types";
import {
  accessReady,
  activePlans,
  activeSession,
  activeServers,
  activeUsage,
  billingHistory,
  createInvoice,
  paymentStatus,
  promoValidate,
  referralLink,
  referralStatsActive,
  subscriptionOffers,
  supportFaqDefault,
} from "./responseBodies";

export function useMockScenarioFetch(
  client: ReturnType<typeof createStorybookQueryClient>,
  scenario: MockScenario,
  onReady?: () => void,
) {
  useLayoutEffect(() => {
    setWebappToken(scenario.token ?? null);
    onReady?.();
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
  }, [client, onReady, scenario]);
}

export function resolveEndpoint(url: string, method: string): MockEndpoint | null {
  if (method === "GET" && url.includes("/webapp/me")) return "me";
  if (method === "GET" && url.includes("/webapp/user/access")) return "access";
  if (method === "POST" && url.includes("/webapp/logout")) return "logout";
  if (method === "GET" && url.includes("/webapp/plans")) return "plans";
  if (method === "GET" && url.includes("/webapp/servers")) return "servers";
  if (method === "GET" && url.includes("/webapp/usage")) return "usage";
  if (method === "GET" && url.includes("/webapp/payments/history")) return "billingHistory";
  if (method === "GET" && url.includes("/webapp/referral/my-link")) return "referralLink";
  if (method === "GET" && url.includes("/webapp/referral/stats")) return "referralStats";
  if (method === "GET" && url.includes("/webapp/support/faq")) return "supportFaq";
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
    case "supportFaq":
      return supportFaqDefault;
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
