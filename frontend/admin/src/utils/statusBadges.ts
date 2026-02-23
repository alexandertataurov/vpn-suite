import type { PrimitiveBadgeVariant } from "@vpn-suite/shared/ui";

export function serverHealthBadge(s: string | null | undefined): { variant: PrimitiveBadgeVariant; label: string } {
  if (!s) return { variant: "info", label: "Pending" };
  const v = String(s).toLowerCase();
  if (v === "running" || v === "ok") return { variant: "success", label: "Active" };
  if (v === "degraded") return { variant: "warning", label: "Maintenance" };
  if (v === "error") return { variant: "danger", label: "Error" };
  return { variant: "info", label: "Pending" };
}
