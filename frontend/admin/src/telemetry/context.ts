/**
 * Mutable context attached to every event. No PII (no tokens, emails, IPs).
 */

export interface TelemetryContextSnapshot {
  route?: string;
  build_hash?: string | null;
  user_agent?: string | null;
}

const context: TelemetryContextSnapshot = {
  route: undefined,
  build_hash: undefined,
  user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
};

export function getContext(): TelemetryContextSnapshot {
  return { ...context };
}

export function setContext(partial: Partial<TelemetryContextSnapshot>): void {
  if (partial.route !== undefined) context.route = partial.route;
  if (partial.build_hash !== undefined) context.build_hash = partial.build_hash;
  if (partial.user_agent !== undefined) context.user_agent = partial.user_agent;
}

export function updateRoute(route: string): void {
  context.route = route;
}
