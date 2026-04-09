/** PostHog product analytics. Gated by env; no-op when disabled. */

interface PostHogLike {
  capture: (event: string, props?: Record<string, unknown>) => void;
  identify: (id: string, traits?: Record<string, unknown>) => void;
  people: { set: (t: Record<string, unknown>) => void };
  reset: () => void;
}

let posthog: PostHogLike | null = null;

export interface PostHogConfig {
  apiKey: string;
  apiHost?: string;
  enabled?: boolean;
  capturePageview?: boolean;
  /** Person profile for identify */
  distinctId?: string;
}

/** Initialize PostHog. Call once at app bootstrap. */
export async function initPostHog(config: PostHogConfig): Promise<PostHogLike | null> {
  if (!config.enabled || !config.apiKey?.trim()) {
    return null;
  }
  try {
    const { default: posthogModule } = await import("posthog-js");
    posthogModule.init(config.apiKey, {
      api_host: config.apiHost ?? "https://us.i.posthog.com",
      capture_pageview: config.capturePageview ?? false,
      capture_exceptions: false,
    });
    posthog = posthogModule;
    if (config.distinctId) {
      posthog.identify(config.distinctId);
    }
    return posthog;
  } catch {
    return null;
  }
}

export function getPostHog(): PostHogLike | null {
  return posthog;
}

export function trackPostHog(
  eventName: string,
  properties?: Record<string, unknown>,
): void {
  posthog?.capture(eventName, properties);
}

export function identifyPostHog(distinctId: string, traits?: Record<string, unknown>): void {
  posthog?.identify(distinctId);
  if (traits && Object.keys(traits).length > 0) {
    posthog?.people.set(traits);
  }
}

export function resetPostHog(): void {
  posthog?.reset();
}
