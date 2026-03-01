/*
 * Lightweight Web Vitals collection (no external deps).
 * Emits webapp telemetry event_type "web_vital" once per metric per page load.
 */

import { webappApi } from "../api/client";

const sent = new Set<string>();

function send(name: string, value: number, unit: "ms" | "score", extra?: Record<string, unknown>): void {
  if (sent.has(name)) return;
  sent.add(name);
  const payload = {
    name,
    value: Number.isFinite(value) ? value : 0,
    unit,
    route: typeof window !== "undefined" ? window.location.pathname : undefined,
    ...extra,
  };
  webappApi.post("/webapp/telemetry", { event_type: "web_vital", payload }).catch(() => {
    /* ignore */
  });
}

function getNavEntry(): PerformanceNavigationTiming | null {
  const nav = performance.getEntriesByType("navigation");
  if (nav && nav.length > 0) return nav[0] as PerformanceNavigationTiming;
  return null;
}

export function initWebVitals(): void {
  if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return;

  const nav = getNavEntry();
  if (nav) {
    const ttfb = Math.max(0, nav.responseStart - nav.requestStart);
    send("TTFB", ttfb, "ms", { nav_type: nav.type });
  }

  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          send("FCP", entry.startTime, "ms");
        }
      }
    });
    po.observe({ type: "paint", buffered: true });
  } catch {
    /* ignore */
  }

  let lcpEntry: PerformanceEntry | null = null;
  try {
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) lcpEntry = entries[entries.length - 1];
    });
    po.observe({ type: "largest-contentful-paint", buffered: true } as PerformanceObserverInit);
  } catch {
    /* ignore */
  }

  let clsValue = 0;
  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEntryList) {
        const e = entry as unknown as { value: number; hadRecentInput?: boolean };
        if (!e.hadRecentInput) clsValue += e.value || 0;
      }
    });
    po.observe({ type: "layout-shift", buffered: true } as PerformanceObserverInit);
  } catch {
    /* ignore */
  }

  let inpValue = 0;
  try {
    const supported = (PerformanceObserver as unknown as { supportedEntryTypes?: string[] }).supportedEntryTypes;
    if (supported && supported.includes("event")) {
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const e = entry as unknown as { duration?: number; interactionId?: number };
          if (e.interactionId && typeof e.duration === "number") {
            inpValue = Math.max(inpValue, e.duration);
          }
        }
      });
      po.observe({ type: "event", buffered: true, durationThreshold: 40 } as PerformanceObserverInit);
    }
  } catch {
    /* ignore */
  }

  const flush = () => {
    if (lcpEntry) send("LCP", lcpEntry.startTime, "ms");
    send("CLS", clsValue, "score");
    if (inpValue > 0) send("INP", inpValue, "ms");
  };

  window.addEventListener("pagehide", flush, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}
