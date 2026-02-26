import { Plus, Smartphone } from "lucide-react";
import { Button, Input, Select } from "@vpn-suite/shared/ui";
import type { DeviceSummaryOut } from "@vpn-suite/shared/types";
import { ButtonLink } from "../ButtonLink";

export interface DevicesControlBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  regionFilter: string;
  onRegionChange: (value: string) => void;
  regionOptions: { value: string; label: string }[];
  summary: DeviceSummaryOut | undefined;
  summaryLoading: boolean;
  onBulkActionsClick: () => void;
  hasSelection: boolean;
  /** Debounced: call when user commits search (e.g. form submit or blur). */
  onSearchSubmit?: () => void;
}

export function DevicesControlBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  regionFilter,
  onRegionChange,
  regionOptions,
  summary,
  summaryLoading,
  onBulkActionsClick,
  hasSelection,
  onSearchSubmit,
}: DevicesControlBarProps) {
  return (
    <div
      className="devices-control-bar"
      role="toolbar"
      aria-label="Devices filters and actions"
    >
      <div className="devices-control-bar-left">
        <form
          className="devices-control-bar-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit?.();
          }}
          role="search"
        >
          <Input
            type="search"
            placeholder="Search ID, email, or device name"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search devices"
            className="devices-control-bar-search"
          />
          <Select
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "revoked", label: "Revoked" },
            ]}
            value={statusFilter}
            onChange={onStatusChange}
            aria-label="Filter by status"
            className="devices-control-bar-status"
          />
          <Select
            options={regionOptions}
            value={regionFilter}
            onChange={onRegionChange}
            aria-label="Filter by region"
            className="devices-control-bar-region"
          />
          {onSearchSubmit ? (
            <Button type="submit" size="sm">
              Load devices
            </Button>
          ) : null}
        </form>
        <div className="devices-control-bar-stats" aria-live="polite">
          {summaryLoading ? (
            <span className="devices-control-bar-stats-loading">—</span>
          ) : summary ? (
            <>
              <span className="devices-control-bar-stat" title="Total devices">
                <Smartphone aria-hidden size={12} />
                {summary.total}
              </span>
              <span className="devices-control-bar-stat devices-control-bar-stat-active" title="Active">
                {summary.active}
              </span>
              <span className="devices-control-bar-stat devices-control-bar-stat-muted" title="Unused configs">
                {summary.unused_configs}
              </span>
              {summary.no_allowed_ips > 0 ? (
                <span className="devices-control-bar-stat devices-control-bar-stat-warn" title="No AllowedIPs">
                  ⚠ {summary.no_allowed_ips}
                </span>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
      <div className="devices-control-bar-right">
        <Button
          variant="ghost"
          size="sm"
          disabled={!hasSelection}
          onClick={onBulkActionsClick}
        >
          Bulk actions
        </Button>
        <ButtonLink to="/servers?issue=1" variant="primary" size="sm">
          <Plus aria-hidden size={14} />
          Issue device
        </ButtonLink>
      </div>
    </div>
  );
}
