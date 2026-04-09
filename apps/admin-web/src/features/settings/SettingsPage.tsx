import { PageLayout } from "@/layout/PageLayout";

export function SettingsPage() {
  return (
    <PageLayout
      title="Settings"
      description="Global defaults for telemetry, security, and operator experience."
      pageClass="settings-page"
    >
      <div className="settings-page__grid">
        <section className="card settings-page__section">
          <div className="settings-page__section-header">
            <h2 className="settings-page__section-title">General</h2>
            <p className="settings-page__section-meta">
              Applies across all dashboard pages.
            </p>
          </div>

          <div className="settings-page__form">
            <div className="input-wrap">
              <label className="input-label">Dashboard refresh interval</label>
              <div className="input-group">
                <input
                  type="number"
                  className="input"
                  defaultValue={30}
                  min={5}
                />
                <span className="input-adornment right">seconds</span>
              </div>
              <span className="input-hint">
                How often KPIs and tables poll for new data.
              </span>
            </div>

            <div className="input-wrap">
              <label className="input-label">
                Default time window <span className="required">*</span>
              </label>
              <div className="select-wrap full">
                <select className="input" defaultValue="24h">
                  <option value="">— choose window</option>
                  <option value="1h">Last 1 hour</option>
                  <option value="6h">Last 6 hours</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                </select>
              </div>
              <span className="input-hint">
                Used for Overview, Telemetry, and Monitor pages.
              </span>
            </div>

            <div className="input-wrap">
              <label className="input-label">Max rows per table page</label>
              <input
                type="number"
                className="input"
                defaultValue={50}
                min={10}
                max={500}
              />
              <span className="input-hint">
                Controls pagination size for DataTable instances.
              </span>
            </div>
          </div>
        </section>

        <section className="card settings-page__section">
          <div className="settings-page__section-header">
            <h2 className="settings-page__section-title">Telemetry & alerts</h2>
            <p className="settings-page__section-meta">
              Live signals, alerting thresholds, and noise controls.
            </p>
          </div>

          <div className="settings-page__form">
            <div className="input-wrap">
              <label className="input-label">Live telemetry</label>
              <label className="toggle-wrap">
                <input
                  type="checkbox"
                  className="toggle-input"
                  defaultChecked
                />
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
                <span className="toggle-label">Enabled</span>
              </label>
              <span className="input-hint">
                When disabled, widgets use on-demand fetch only.
              </span>
            </div>

            <div className="input-wrap">
              <label className="input-label">Alert fan-out limit</label>
              <div className="input-group">
                <input
                  type="number"
                  className="input"
                  defaultValue={10}
                  min={1}
                />
                <span className="input-adornment right">per minute</span>
              </div>
              <span className="input-hint">
                Back-pressure guardrail for noisy alert sources.
              </span>
            </div>

            <div className="input-wrap">
              <label className="input-label">
                Alert routing email <span className="required">*</span>
              </label>
              <input
                type="email"
                className="input is-error"
                defaultValue="ops@"
                aria-invalid="true"
                aria-describedby="settings-alert-email-error"
              />
              <span
                id="settings-alert-email-error"
                className="input-hint is-error"
              >
                Invalid format — expected something like ops@domain.io
              </span>
            </div>
          </div>
        </section>

        <section className="card settings-page__section settings-page__section--stacked">
          <div className="settings-page__section-header">
            <h2 className="settings-page__section-title">Security</h2>
            <p className="settings-page__section-meta">
              Operator session hardening and audit behavior.
            </p>
          </div>

          <div className="settings-page__form settings-page__form--inline">
            <div className="input-wrap">
              <label className="input-label">
                Session idle timeout <span className="required">*</span>
              </label>
              <div className="input-group">
                <input
                  type="number"
                  className="input is-success"
                  defaultValue={30}
                  min={5}
                  aria-describedby="settings-session-timeout-hint"
                />
                <span className="input-adornment right">minutes</span>
              </div>
              <span
                id="settings-session-timeout-hint"
                className="input-hint is-success"
              >
                Looks good — matches organization policy.
              </span>
            </div>

            <div className="input-wrap">
              <label className="input-label">Require re-auth for risky ops</label>
              <label className="toggle-wrap success">
                <input
                  type="checkbox"
                  className="toggle-input"
                  defaultChecked
                />
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
                <span className="toggle-label">Active</span>
              </label>
              <span className="input-hint">
                Applies to destructive automation and node-level actions.
              </span>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
