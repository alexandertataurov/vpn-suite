import { recordResourceEvent } from "./resourceDebug";

export interface RefreshResult {
  source: string;
  ok: boolean;
  error?: unknown;
}

const registry = new Map<string, () => Promise<void>>();

export function registerResource(source: string, refresh: () => Promise<void>) {
  registry.set(source, refresh);
  return () => {
    if (registry.get(source) === refresh) registry.delete(source);
  };
}

export async function refreshRegisteredResources(): Promise<RefreshResult[]> {
  const entries = Array.from(registry.entries());
  return Promise.all(
    entries.map(async ([source, refresh]) => {
      try {
        recordResourceEvent(source, { status: "loading", count: 1, lastRequestedAt: new Date().toISOString() });
        await refresh();
        return { source, ok: true };
      } catch (error) {
        recordResourceEvent(source, { status: "error", lastError: { message: String(error) } });
        return { source, ok: false, error };
      }
    })
  );
}
