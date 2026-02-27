import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Skeleton } from "@vpn-suite/shared/ui";
import { api } from "../../api/client";
import { AlertTriangle } from "lucide-react";

interface PaymentMonitor {
  failed_24h: number;
  webhook_errors_24h: number;
}

export function AlertsPanel() {
  const { data, isLoading, error } = useQuery<PaymentMonitor>({
    queryKey: ["admin", "payments", "monitor"],
    queryFn: ({ signal }) => api.get<PaymentMonitor>("/admin/payments/monitor", { signal }),
    staleTime: 30_000,
  });

  if (error) return null;
  if (isLoading || !data) {
    return (
      <div className="card p-3 mb-3">
        <Skeleton height={40} />
      </div>
    );
  }

  const hasAlerts = data.failed_24h > 0 || data.webhook_errors_24h > 0;
  if (!hasAlerts) return null;

  return (
    <div className="card p-3 mb-3 border-warning">
      <div className="d-flex align-items-center gap-2">
        <AlertTriangle className="icon-sm text-warning" />
        <span className="small fw-medium">Alerts</span>
        <Link to="/payments-monitor" className="small ms-auto">Payments</Link>
      </div>
      <div className="d-flex gap-3 mt-1">
        {data.failed_24h > 0 && <span className="text-danger">Failed payments (24h): {data.failed_24h}</span>}
        {data.webhook_errors_24h > 0 && <span className="text-warning">Webhook errors: {data.webhook_errors_24h}</span>}
      </div>
    </div>
  );
}
