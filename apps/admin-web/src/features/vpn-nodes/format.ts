/** Formatting for VPN node metrics. Missing values show — (em-dash). */

const DASH = "—";

export function formatBps(bps: number | null | undefined): string {
  if (bps == null) return DASH;
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(1)} Gbps`;
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} Mbps`;
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(0)} Kbps`;
  return `${bps} bps`;
}

export function formatMs(ms: number | null | undefined): string {
  if (ms == null) return DASH;
  return `${Math.round(ms)} ms`;
}

export function formatPct(pct: number | null | undefined): string {
  if (pct == null) return DASH;
  return `${Math.round(pct * 10) / 10}%`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return DASH;
  return String(n);
}

export function dash<T>(v: T | null | undefined): string {
  if (v == null || v === "") return DASH;
  return String(v);
}

/** Last handshake age for display (e.g. "2m", "1h"). */
export function formatHandshakeAge(ts: string | null | undefined): string {
  if (ts == null || ts === "") return DASH;
  const t = new Date(ts).getTime();
  if (Number.isNaN(t)) return DASH;
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}
