import type { ReactNode } from "react";
import { DataCell, DataGrid, SettingsCard } from "@/design-system";
import { Link } from "react-router-dom";

export interface SettingsAccountOverviewCardProps {
  initial: string;
  name: string;
  hasPlan: boolean;
  planLabel: string;
  renewalCountdownLabel: string;
  deviceCountLabel: string;
  planActionTo: string;
  noPlanLabel: string;
  planCtaLabel: string;
  renewalDateValue: string;
  languageLabel: string;
  languageValue: ReactNode;
  overviewPlanLabel: string;
  overviewDevicesLabel: string;
  overviewRenewsLabel: string;
}

export function SettingsAccountOverviewCard({
  initial,
  name,
  hasPlan,
  planLabel,
  renewalCountdownLabel,
  deviceCountLabel,
  planActionTo,
  noPlanLabel,
  planCtaLabel,
  renewalDateValue,
  languageLabel,
  languageValue,
  overviewPlanLabel,
  overviewDevicesLabel,
  overviewRenewsLabel,
}: SettingsAccountOverviewCardProps) {
  return (
    <SettingsCard className="module-card settings-account-card">
      <div className="settings-account-banner">
        <div className="settings-account-banner__identity">
          <div className="settings-account-banner__avatar" aria-hidden>
            {initial}
          </div>
          <div className="settings-account-banner__copy">
            <div className="settings-account-banner__name">{name}</div>
            <div className="settings-account-banner__meta">
              {hasPlan ? `${planLabel} · ${renewalCountdownLabel}` : noPlanLabel}
            </div>
            {hasPlan ? (
              <div className="settings-account-banner__device-status">
                <span className="settings-account-banner__dot" aria-hidden />
                <span>{deviceCountLabel}</span>
              </div>
            ) : (
              <Link className="settings-account-banner__cta" to={planActionTo}>
                {planCtaLabel}
              </Link>
            )}
          </div>
        </div>
      </div>

      <DataGrid columns={2}>
        <DataCell
          label={overviewPlanLabel}
          value={hasPlan ? planLabel : (
            <Link className="settings-summary-link" to={planActionTo}>
              {planCtaLabel}
            </Link>
          )}
          cellType="plan"
        />
        <DataCell label={overviewDevicesLabel} value={deviceCountLabel} />
        <DataCell label={overviewRenewsLabel} value={renewalDateValue} />
        <DataCell label={languageLabel} value={languageValue} />
      </DataGrid>
    </SettingsCard>
  );
}
