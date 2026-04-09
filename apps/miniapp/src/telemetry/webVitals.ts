/*
 * Lightweight Web Vitals collection (no external deps).
 * Emits webapp telemetry event_type "web_vital" once per metric per page load.
 * Optional: set VITE_WEB_VITALS_ENABLED=0 to disable. Defaults to VITE_ANALYTICS_ENABLED if unset.
 */

import { track } from "@vpn-suite/shared";
import type { WebVitalTelemetryPayload } from "@vpn-suite/shared";

/** Layout Shift entry shape (LayoutShift in DOM; not all TS libs narrow it). */
interface LayoutShiftEntryLike extends PerformanceEntry {
  value: number;
  hadRecentInput?: boolean;
}

/** Event timing entry shape (for INP). */
interface EventTimingEntryLike {
  duration?: number;
  interactionId?: number;
}

interface PerformanceObserverConstructorWithTypes {
  supportedEntryTypes?: readonly string[];
}

const sent = new Set<string>();

function send(
  name: string,
  value: number,
  unit: "ms" | "score",
  extra?: Partial<WebVitalTelemetryPayload>,
): void {
  if (sent.has(name)) return;
  sent.add(name);
  const payload: WebVitalTelemetryPayload = {
    name,
    value: Number.isFinite(value) ? value : 0,
    unit,
    route: typeof window !== "undefined" ? window.location.pathname : undefined,
    ...(extra ?? {}),
  };
  track("miniapp.web_vital", payload);
}

function getNavEntry(): PerformanceNavigationTiming | null {
  const nav = performance.getEntriesByType("navigation");
  if (nav && nav.length > 0) return nav[0] as PerformanceNavigationTiming;
  return null;
}

export function initWebVitals(): void {
  if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return;
  const enabled = import.meta.env.VITE_WEB_VITALS_ENABLED ?? import.meta.env.VITE_ANALYTICS_ENABLED;
  if (enabled === "0" || enabled === "false") return;

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
    /* ignore: paint/observer unsupported in some environments */
  }

  let lcpEntry: PerformanceEntry | null = null;
  try {
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) lcpEntry = last;
    });
    po.observe({ type: "largest-contentful-paint", buffered: true } as PerformanceObserverInit);
  } catch {
    /* ignore: LCP observer unsupported in some environments */
  }

  let clsValue = 0;
  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as LayoutShiftEntryLike;
        if ("value" in e && !e.hadRecentInput) clsValue += e.value || 0;
      }
    });
    po.observe({ type: "layout-shift", buffered: true } as PerformanceObserverInit);
  } catch {
    /* ignore: layout-shift observer unsupported in some environments */
  }

  let inpValue = 0;
  try {
    const supported = (PerformanceObserver as PerformanceObserverConstructorWithTypes).supportedEntryTypes;
    if (supported?.includes("event")) {
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const e = entry as EventTimingEntryLike;
          if (e.interactionId != null && typeof e.duration === "number") {
            inpValue = Math.max(inpValue, e.duration);
          }
        }
      });
      po.observe({ type: "event", buffered: true, durationThreshold: 40 } as PerformanceObserverInit);
    }
  } catch {
    /* ignore: event observer unsupported in some environments */
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
