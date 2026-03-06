import { useEffect } from "react";
import type { ReactNode } from "react";
import type { WebAppIssueDeviceResponse, WebAppMeResponse } from "@vpn-suite/shared";

type MockMode = "success" | "error" | "loading";

export interface WebappMockOptions {
  mode?: MockMode;
  me?: WebAppMeResponse;
  meStatus?: number;
  issueDevice?: WebAppIssueDeviceResponse;
  issueStatus?: number;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function MockWebappApi({ children, options }: { children: ReactNode; options: WebappMockOptions }) {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    const mode = options.mode ?? "success";

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/webapp/me")) {
        if (mode === "loading") {
          return new Promise<Response>(() => undefined as never);
        }
        if (mode === "error") {
          return jsonResponse({ error: { message: "Mocked error" } }, options.meStatus ?? 500);
        }
        return jsonResponse(options.me ?? { user: null, subscriptions: [], devices: [] }, options.meStatus ?? 200);
      }

      if (url.includes("/webapp/devices/issue")) {
        if (mode === "loading") {
          return new Promise<Response>(() => undefined as never);
        }
        if (mode === "error") {
          return jsonResponse({ error: { message: "Mocked error" } }, options.issueStatus ?? 500);
        }
        return jsonResponse(
          options.issueDevice ?? { config_awg: "[mock-config]", peer_created: true, device_id: "device-1" },
          options.issueStatus ?? 200
        );
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [options]);

  return <>{children}</>;
}
