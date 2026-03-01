import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Skeleton } from "@/design-system";
import { api } from "../../api/client";
import { IconWarning } from "@/design-system/icons";

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
      <div className="operator-card dashboard-strip">
        <Skeleton height={72} />
      </div>
    );
  }

  const hasAlerts = data.failed_24h > 0 || data.webhook_errors_24h > 0;
  if (!hasAlerts) return null;

  return (
    <div className="operator-card dashboard-strip dashboard-strip--alert">
      <div className="dashboard-strip__header">
        <IconWarning className="dashboard-strip__icon dashboard-strip__icon--warning" aria-hidden size={14} strokeWidth={1.5} />
        <span className="dashboard-strip__label">Alerts</span>
        <Link to="/payments-monitor" className="dashboard-strip__link">Payments</Link>
      </div>
      <div className="dashboard-strip__values">
        {data.failed_24h > 0 && <span className="dashboard-strip__value--danger">Failed payments (24h): {data.failed_24h}</span>}
        {data.webhook_errors_24h > 0 && <span className="dashboard-strip__value--warning">Webhook errors: {data.webhook_errors_24h}</span>}
      </div>
    </div>
  );
}
