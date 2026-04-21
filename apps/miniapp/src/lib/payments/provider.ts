export type WebAppPaymentProvider = "telegram_stars" | "platega";

const PAYMENT_PROVIDER_PARAM = "payment_provider";
const PAYMENT_PROVIDER_STORAGE_KEY = "miniapp_payment_provider";

function normalizePaymentProvider(raw: string | null | undefined): WebAppPaymentProvider | null {
  const normalized = (raw ?? "").trim().toLowerCase();
  if (normalized === "telegram_stars" || normalized === "platega") {
    return normalized;
  }
  return null;
}

export function capturePreferredPaymentProvider(): WebAppPaymentProvider | null {
  if (typeof window === "undefined") return null;
  const fromQuery = normalizePaymentProvider(
    new URLSearchParams(window.location.search).get(PAYMENT_PROVIDER_PARAM),
  );
  if (!fromQuery) return null;
  try {
    window.sessionStorage.setItem(PAYMENT_PROVIDER_STORAGE_KEY, fromQuery);
  } catch {
    // Ignore storage errors in restricted runtimes.
  }
  return fromQuery;
}

export function getPreferredPaymentProvider(): WebAppPaymentProvider | null {
  if (typeof window === "undefined") return null;
  const fromQuery = capturePreferredPaymentProvider();
  if (fromQuery) return fromQuery;
  try {
    return normalizePaymentProvider(window.sessionStorage.getItem(PAYMENT_PROVIDER_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function withPreferredPaymentProvider(path: string): string {
  const provider = getPreferredPaymentProvider();
  if (!provider) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${PAYMENT_PROVIDER_PARAM}=${encodeURIComponent(provider)}`;
}

