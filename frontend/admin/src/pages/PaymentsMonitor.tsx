import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/design-system";
import { Heading } from "@/design-system";
import { api } from "../api/client";
import { DashboardPage } from "../templates/DashboardPage";

interface PaymentMonitor {
  success_24h: number;
  failed_24h: number;
  pending_count: number;
  webhook_errors_24h: number;
  refund_rate_30d: number;
}

interface WebhookErrorRow {
  id: string;
  payment_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export function PaymentsMonitorPage() {
  const { data, error, isLoading } = useQuery<PaymentMonitor>({
    queryKey: ["admin", "payments", "monitor"],
    queryFn: ({ signal }) => api.get<PaymentMonitor>("/admin/payments/monitor", { signal }),
    staleTime: 30_000,
  });
  const { data: webhookErrors } = useQuery<WebhookErrorRow[]>({
    queryKey: ["admin", "payments", "webhook-errors"],
    queryFn: ({ signal }) => api.get<WebhookErrorRow[]>("/admin/payments/webhook-errors?limit=50", { signal }),
    staleTime: 30_000,
  });

  if (error) {
    return (
      <DashboardPage className="ref-page" title="PAYMENTS MONITOR">
        <p className="text-danger">{String(error)}</p>
      </DashboardPage>
    );
  }

  if (isLoading || !data) {
    return (
      <DashboardPage className="ref-page" title="PAYMENTS MONITOR">
        <Skeleton height={120} />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage className="ref-page" data-testid="payments-monitor-page" title="PAYMENTS MONITOR">
      <div className="grid gap-3 mt-3 ref-auto-grid-160">
        <div className="card p-3">
          <div className="text-muted small">Success (24h)</div>
          <div className="h4 mb-0 text-success">{data.success_24h}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Failed (24h)</div>
          <div className="h4 mb-0 text-danger">{data.failed_24h}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Pending</div>
          <div className="h4 mb-0">{data.pending_count}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Webhook errors (24h)</div>
          <div className="h4 mb-0">{data.webhook_errors_24h}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Refund rate (30d)</div>
          <div className="h4 mb-0">{(Number(data.refund_rate_30d) * 100).toFixed(1)}%</div>
        </div>
      </div>
      {webhookErrors && webhookErrors.length > 0 && (
        <div className="card mt-3">
          <Heading level={3} className="h6 p-3 mb-0">Recent webhook errors</Heading>
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Event type</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {webhookErrors.map((row) => (
                <tr key={row.id}>
                  <td><code>{row.payment_id}</code></td>
                  <td>{row.event_type}</td>
                  <td>{row.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardPage>
  );
}
