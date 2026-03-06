export function getBaseUrl(): string {
  const u =
    typeof import.meta !== "undefined" &&
    (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL;
  if (u) return String(u).replace(/\/$/, "");
  if (typeof window !== "undefined") return `${window.location.origin}/api/v1`;
  return "/api/v1";
}
