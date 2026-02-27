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
  { value: "spacious", label: "Spacious" },
];

const AUTO_REFRESH_OPTIONS: SelectOption[] = [
  { value: "0", label: "Off" },
  { value: "15", label: "15 sec" },
  { value: "30", label: "30 sec" },
  { value: "60", label: "60 sec" },
];

const TIME_RANGE_OPTIONS: SelectOption[] = [
  { value: "1h", label: "Last 1 hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
];

const WIDGET_OPTIONS: { key: keyof DashboardSettingsType["visibleWidgets"]; label: string }[] = [
  { key: "health", label: "Health summary" },
  { key: "capacity", label: "Capacity (users, subs, MRR)" },
  { key: "trends", label: "Trends (charts)" },
  { key: "topIssues", label: "Top issues" },
  { key: "recentAudit", label: "Recent audit" },
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
      className="dashboard-settings-modal"
      data-testid="dashboard-settings-modal"
    >
      <div className="dashboard-settings-body">
        <section className="dashboard-settings-section" aria-labelledby="settings-layout-heading">
          <h3 id="settings-layout-heading" className="dashboard-settings-section__title">
            Layout
          </h3>
          <p className="dashboard-settings-section__desc">Control how dense or spacious the dashboard appears.</p>
          <div className="dashboard-settings-section__fields">
            <Field id="dashboard-density" label="Density">
              <Select
                id="dashboard-density"
                options={DENSITY_OPTIONS}
                value={settings.density}
                onChange={(v) => onChange("density", v as DashboardSettingsType["density"])}
                aria-label="Dashboard density"
              />
            </Field>
          </div>
        </section>

        <section className="dashboard-settings-section" aria-labelledby="settings-data-heading">
          <h3 id="settings-data-heading" className="dashboard-settings-section__title">
            Data &amp; refresh
          </h3>
          <p className="dashboard-settings-section__desc">Auto-refresh interval and default time range for charts.</p>
          <div className="dashboard-settings-grid">
            <Field id="dashboard-auto-refresh" label="Auto-refresh">
              <Select
                id="dashboard-auto-refresh"
                options={AUTO_REFRESH_OPTIONS}
                value={String(settings.autoRefreshInterval)}
                onChange={(v) =>
                  onChange("autoRefreshInterval", parseInt(v, 10) as DashboardSettingsType["autoRefreshInterval"])
                }
                aria-label="Auto-refresh interval"
              />
            </Field>
            <Field id="dashboard-time-range" label="Default time range">
              <Select
                id="dashboard-time-range"
                options={TIME_RANGE_OPTIONS}
                value={settings.defaultTimeRange}
                onChange={(v) => onChange("defaultTimeRange", v as DashboardSettingsType["defaultTimeRange"])}
                aria-label="Default time range"
              />
            </Field>
          </div>
          <div className="dashboard-settings-section__fields">
            <Field id="dashboard-pinned-region" label="Pin region">
              <Select
                id="dashboard-pinned-region"
                options={pinnedOptions}
                value={settings.pinnedRegion ?? ""}
                onChange={(v) => onChange("pinnedRegion", v === "" ? null : v)}
                aria-label="Pinned region for Top Issues"
              />
            </Field>
          </div>
        </section>

        <section className="dashboard-settings-section" aria-labelledby="settings-widgets-heading">
          <h3 id="settings-widgets-heading" className="dashboard-settings-section__title">
            Visible widgets
          </h3>
          <p className="dashboard-settings-section__desc">Choose which sections appear on the dashboard.</p>
          <div className="dashboard-settings-checkboxes" role="group" aria-labelledby="settings-widgets-heading">
            {WIDGET_OPTIONS.map(({ key, label }) => (
              <Checkbox
                key={key}
                label={label}
                checked={settings.visibleWidgets[key]}
                onChange={(e) =>
                  onChange("visibleWidgets", { ...settings.visibleWidgets, [key]: e.target.checked })
                }
              />
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}
