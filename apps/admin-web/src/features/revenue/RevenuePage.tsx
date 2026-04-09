import { useState } from "react";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { SectionHeader, Skeleton, Widget } from "@/design-system/primitives";
import { PageLayout } from "@/layout/PageLayout";
import { KpiValue } from "@/design-system/typography";
import type { FunnelKpisOut } from "@/shared/types/admin-api";

const FUNNEL_DAYS_OPTIONS = [7, 30, 90] as const;

function formatPct(value: number | null): string {
  if (value == null) return "—";
  return `${value}%`;
}

export function RevenuePage() {
  const [days, setDays] = useState<number>(30);

  const {
    data: funnelKpis,
    isLoading: isFunnelLoading,
    isError: isFunnelError,
    error: funnelError,
    refetch: refetchFunnel,
  } = useApiQuery<FunnelKpisOut>(
    ["analytics", "funnel-kpis", days],
    `/analytics/funnel-kpis?days=${days}`,
    { retry: 1 }
  );

  return (
    <PageLayout
      title="Revenue"
      description="Funnel conversion KPIs and revenue metrics."
      pageClass="revenue-page"
    >
      <SectionHeader
        label="Funnel KPIs"
        size="lg"
        note={
          <select
            className="input input--sm"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            aria-label="Time window (days)"
          >
            {FUNNEL_DAYS_OPTIONS.map((d) => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </select>
        }
      />
      {isFunnelLoading && <Skeleton height={120} />}
      {isFunnelError && (
        <p className="type-body-sm is-error" role="alert">
          {funnelError instanceof Error ? funnelError.message : "Failed to load funnel KPIs."}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => refetchFunnel()}>
            Retry
          </button>
        </p>
      )}
      {!isFunnelLoading && !isFunnelError && funnelKpis && (
        <div className="kpi-grid revenue-page__cards">
          <Widget title="Plan → Payment" subtitle="conversion" variant="kpi" size="medium">
            <KpiValue as="div" className="kpi__value">
              {formatPct(funnelKpis.conversion_plan_to_payment_pct)}
            </KpiValue>
          </Widget>
          <Widget title="Payment → Device" subtitle="conversion" variant="kpi" size="medium">
            <KpiValue as="div" className="kpi__value">
              {formatPct(funnelKpis.conversion_payment_to_device_pct)}
            </KpiValue>
          </Widget>
          <Widget title="Device → Connected" subtitle="conversion" variant="kpi" size="medium">
            <KpiValue as="div" className="kpi__value">
              {formatPct(funnelKpis.conversion_device_to_connected_pct)}
            </KpiValue>
          </Widget>
          <Widget title="Trial → Paid" subtitle="conversion" variant="kpi" size="medium">
            <KpiValue as="div" className="kpi__value">
              {formatPct(funnelKpis.conversion_trial_to_paid_pct)}
            </KpiValue>
          </Widget>
          <Widget title="Cancel → Retained" subtitle="pause selected" variant="kpi" size="medium">
            <KpiValue as="div" className="kpi__value">
              {formatPct(funnelKpis.conversion_cancel_retained_pct)}
            </KpiValue>
          </Widget>
          <Widget title="Referral → Rewarded" subtitle="conversion" variant="kpi" size="medium">
            <KpiValue as="div" className="kpi__value">
              {formatPct(funnelKpis.conversion_referral_rewarded_pct)}
            </KpiValue>
          </Widget>
        </div>
      )}
    </PageLayout>
  );
}
