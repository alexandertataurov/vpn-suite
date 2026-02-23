import type { DashboardSettings as DashboardSettingsType } from "../../hooks/useDashboardSettings";
import type { SelectOption } from "@vpn-suite/shared/ui";
import { Modal, Button, Select, Checkbox, Field } from "@vpn-suite/shared/ui";

export interface DashboardSettingsProps {
  open: boolean;
  onClose: () => void;
  settings: DashboardSettingsType;
  onChange: (key: keyof DashboardSettingsType, value: DashboardSettingsType[keyof DashboardSettingsType]) => void;
  regionOptions: SelectOption[];
}

const DENSITY_OPTIONS: SelectOption[] = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
];

const AUTO_REFRESH_OPTIONS: SelectOption[] = [
  { value: "0", label: "Off" },
  { value: "15", label: "15 seconds" },
  { value: "30", label: "30 seconds" },
  { value: "60", label: "60 seconds" },
];

const TIME_RANGE_OPTIONS: SelectOption[] = [
  { value: "1h", label: "Last 1 hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
];

export function DashboardSettings({ open, onClose, settings, onChange, regionOptions }: DashboardSettingsProps) {
  const pinnedOptions: SelectOption[] = [{ value: "", label: "None" }, ...regionOptions.filter((o) => o.value !== "all")];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Dashboard settings"
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
      data-testid="dashboard-settings-modal"
    >
      <div className="dashboard-settings-fields">
        <Field id="dashboard-density" label="Density">
          <Select
            id="dashboard-density"
            options={DENSITY_OPTIONS}
            value={settings.density}
            onChange={(v) => onChange("density", v as DashboardSettingsType["density"])}
            aria-label="Dashboard density"
          />
        </Field>
        <Field id="dashboard-auto-refresh" label="Auto-refresh">
          <Select
            id="dashboard-auto-refresh"
            options={AUTO_REFRESH_OPTIONS}
            value={String(settings.autoRefreshInterval)}
            onChange={(v) => onChange("autoRefreshInterval", parseInt(v, 10) as DashboardSettingsType["autoRefreshInterval"])}
            aria-label="Auto-refresh interval"
          />
        </Field>
        <Field id="dashboard-time-range" label="Default time range (label only)">
          <Select
            id="dashboard-time-range"
            options={TIME_RANGE_OPTIONS}
            value={settings.defaultTimeRange}
            onChange={(v) => onChange("defaultTimeRange", v as DashboardSettingsType["defaultTimeRange"])}
            aria-label="Default time range"
          />
        </Field>
        <Field id="dashboard-pinned-region" label="Pin region for dashboard">
          <Select
            id="dashboard-pinned-region"
            options={pinnedOptions}
            value={settings.pinnedRegion ?? ""}
            onChange={(v) => onChange("pinnedRegion", v === "" ? null : v)}
            aria-label="Pinned region for Top Issues"
          />
        </Field>
        <div className="dashboard-settings-widgets" role="group" aria-labelledby="dashboard-visible-label">
          <span id="dashboard-visible-label" className="field-label">
            Visible widgets
          </span>
          <div className="dashboard-settings-checkboxes">
            <Checkbox
              label="Health summary"
              checked={settings.visibleWidgets.health}
              onChange={(e) => onChange("visibleWidgets", { ...settings.visibleWidgets, health: e.target.checked })}
            />
            <Checkbox
              label="Capacity (users, subs, MRR)"
              checked={settings.visibleWidgets.capacity}
              onChange={(e) => onChange("visibleWidgets", { ...settings.visibleWidgets, capacity: e.target.checked })}
            />
            <Checkbox
              label="Trends (charts)"
              checked={settings.visibleWidgets.trends}
              onChange={(e) => onChange("visibleWidgets", { ...settings.visibleWidgets, trends: e.target.checked })}
            />
            <Checkbox
              label="Top issues"
              checked={settings.visibleWidgets.topIssues}
              onChange={(e) => onChange("visibleWidgets", { ...settings.visibleWidgets, topIssues: e.target.checked })}
            />
            <Checkbox
              label="Recent audit"
              checked={settings.visibleWidgets.recentAudit}
              onChange={(e) => onChange("visibleWidgets", { ...settings.visibleWidgets, recentAudit: e.target.checked })}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
