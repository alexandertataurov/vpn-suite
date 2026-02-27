import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon } from "lucide-react";
import { Button, Panel, ConfirmDanger, ConfirmModal, Modal, useToast } from "@vpn-suite/shared/ui";
import { useTheme } from "@vpn-suite/shared/theme";
import type { AppSettingsOut } from "@vpn-suite/shared/types";
import { useAuthStore } from "../store/authStore";
import { PageHeader } from "../components/PageHeader";
import { api } from "../api/client";
import { APP_SETTINGS_KEY } from "../api/query-keys";

interface EnvFileOut {
  path: string;
  content: string;
}

interface TotpSetupResponse {
  secret: string;
  provisioning_uri: string;
}

export function SettingsPage() {
  const { theme, themes, setTheme } = useTheme();
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [totpSetupResult, setTotpSetupResult] = useState<TotpSetupResponse | null>(null);
  const [totpDisableOpen, setTotpDisableOpen] = useState(false);
  const addToast = useToast();
  const { data: appSettings, isLoading: appSettingsLoading } = useQuery<AppSettingsOut>({
    queryKey: APP_SETTINGS_KEY,
    queryFn: ({ signal }) => api.get<AppSettingsOut>("/app/settings", { signal }),
  });
  const {
    data: envFile,
    isLoading: envLoading,
  } = useQuery<EnvFileOut>({
    queryKey: ["app", "env"],
    queryFn: ({ signal }) => api.get<EnvFileOut>("/app/env", { signal }),
  });
  const [configDailyCap, setConfigDailyCap] = useState<string>("");
  const [trialHours, setTrialHours] = useState<string>("");
  const [referralBonusDays, setReferralBonusDays] = useState<string>("");
  const [retentionDiscount, setRetentionDiscount] = useState<string>("");
  const [corsAllowOrigins, setCorsAllowOrigins] = useState<string>("");
  const [envContent, setEnvContent] = useState<string>("");

  useEffect(() => {
    if (!appSettings) return;
    setConfigDailyCap(
      appSettings.config_regen_daily_cap != null ? String(appSettings.config_regen_daily_cap) : ""
    );
    setTrialHours(
      appSettings.trial_duration_hours != null ? String(appSettings.trial_duration_hours) : ""
    );
    setReferralBonusDays(
      appSettings.referral_reward_bonus_days != null
        ? String(appSettings.referral_reward_bonus_days)
        : ""
    );
    setRetentionDiscount(
      appSettings.retention_discount_percent != null
        ? String(appSettings.retention_discount_percent)
        : ""
    );
    setCorsAllowOrigins(appSettings.cors_allow_origins ?? "");
  }, [appSettings]);

  useEffect(() => {
    if (!envFile) return;
    setEnvContent(envFile.content);
  }, [envFile]);

  const saveEnvMutation = useMutation({
    mutationFn: () => api.put<EnvFileOut>("/app/env", { content: envContent }),
    onSuccess: (data) => {
      setEnvContent(data.content);
      addToast("Env file saved. Restart the stack to apply changes.", "success");
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      addToast(err?.response?.data?.detail ?? "Failed to save env file", "error");
    },
  });

  const updateAppSettingsMutation = useMutation({
    mutationFn: () =>
      api.patch<AppSettingsOut>("/app/settings", {
        config_regen_daily_cap: configDailyCap === "" ? 0 : Number(configDailyCap),
        trial_duration_hours: trialHours === "" ? 0 : Number(trialHours),
        referral_reward_bonus_days: referralBonusDays === "" ? 0 : Number(referralBonusDays),
        retention_discount_percent: retentionDiscount === "" ? 0 : Number(retentionDiscount),
        cors_allow_origins: corsAllowOrigins.trim(),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(APP_SETTINGS_KEY, data);
      addToast("App settings updated. Changes apply to new requests.", "success");
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      addToast(err?.response?.data?.detail ?? "Failed to update app settings", "error");
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: (confirm_token: string) =>
      api.post<{ ok: boolean; message: string }>("/app/settings/cleanup-db", { confirm_token }),
    onSuccess: () => {
      setCleanupOpen(false);
      addToast("Database cleaned. Devices, users, subscriptions and related data removed.", "success");
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      addToast(err?.response?.data?.detail ?? "Cleanup failed", "error");
    },
  });
  const totpSetupMutation = useMutation({
    mutationFn: () => api.post<TotpSetupResponse>("/auth/totp/setup", {}),
    onSuccess: (data) => {
      setTotpSetupResult(data);
      addToast("2FA setup started. Add the secret to your authenticator app.", "success");
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      addToast(err?.response?.data?.detail ?? "2FA setup failed", "error");
    },
  });
  const totpDisableMutation = useMutation({
    mutationFn: () => api.post("/auth/totp/disable", {}),
    onSuccess: () => {
      setTotpDisableOpen(false);
      addToast("2FA disabled.", "success");
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      addToast(err?.response?.data?.detail ?? "Disable 2FA failed", "error");
    },
  });

  return (
    <div className="ref-page" data-testid="settings-page">
      <PageHeader icon={SettingsIcon} title="Settings" description="Appearance and account controls" />

      <div className="ref-page-sections">
        <Panel as="section" variant="outline" aria-label="Env file editor">
          <div className="ref-section-head">
            <h3 className="ref-settings-title">Environment file (.env)</h3>
          </div>
          <p className="ref-settings-text">
            Edit the full .env file used by this stack. Changes can affect database, auth, bot and
            telemetry behavior, so update carefully.
          </p>
          {envLoading && <p className="small mb-0">Loading .env…</p>}
          {!envLoading && envFile && (
            <>
              <p className="small text-muted mb-1">
                Editing:{" "}
                <code className="bg-light rounded px-1 py-0">{envFile.path}</code>
              </p>
              <textarea
                className="form-control font-monospace"
                rows={14}
                spellCheck={false}
                value={envContent}
                onChange={(e) => setEnvContent(e.target.value)}
              />
              <div className="d-flex justify-content-between align-items-center mt-2">
                <span className="small text-muted">
                  Save, then restart the core stack (e.g. ./manage.sh down-core && ./manage.sh
                  up-core) to apply changes.
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => saveEnvMutation.mutate()}
                  loading={saveEnvMutation.isPending}
                  disabled={envLoading}
                >
                  Save .env
                </Button>
              </div>
            </>
          )}
        </Panel>

        <Panel as="section" variant="outline" aria-label="Environment and app settings">
          <div className="ref-section-head">
            <h3 className="ref-settings-title">Environment &amp; app settings (.env)</h3>
          </div>
          <p className="ref-settings-text">
            View and adjust key configuration derived from the server&apos;s .env file. These
            settings control how the admin cluster behaves for users and operators.
          </p>
          <div className="d-flex flex-column gap-3 small">
            {appSettingsLoading && <p className="mb-0">Loading environment settings…</p>}
            {!appSettingsLoading && appSettings && (
              <>
                <div className="d-flex flex-wrap gap-4">
                  <div>
                    <div className="fw-semibold">Environment</div>
                    <div className="text-muted">
                      {appSettings.environment ?? "development"} — controls production safety checks
                      and strict secret validation.
                    </div>
                  </div>
                  <div>
                    <div className="fw-semibold">Node mode</div>
                    <div className="text-muted">
                      {appSettings.node_mode} — mock: no real VPN provisioning; real: call VPN
                      nodes directly; agent: node-agent reconciles desired state.
                    </div>
                  </div>
                  <div>
                    <div className="fw-semibold">Node discovery</div>
                    <div className="text-muted">
                      {(appSettings.node_discovery ?? "docker") +
                        " — docker: single-host Docker discovery; agent: node-agent reports nodes."}
                    </div>
                  </div>
                  <div>
                    <div className="fw-semibold">VPN default host</div>
                    <div className="text-muted">
                      {appSettings.vpn_default_host && appSettings.vpn_default_host.trim() !== ""
                        ? `${appSettings.vpn_default_host} — used to derive client endpoints when nodes report private IPs only.`
                        : "Not set — endpoints are taken from nodes as reported."}
                    </div>
                  </div>
                </div>

                <hr className="my-2" />

                <div className="d-flex flex-column gap-2">
                  <label className="small fw-medium mb-0">
                    Config regeneration limit per user (per day)
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min={0}
                    value={configDailyCap}
                    onChange={(e) => setConfigDailyCap(e.target.value)}
                    placeholder="0 = unlimited"
                  />
                  <div className="text-muted">
                    Helps prevent abuse by limiting how many times a user can regenerate VPN config
                    in 24 hours. Set to 0 for no limit.
                  </div>
                </div>

                <div className="d-flex flex-column gap-2">
                  <label className="small fw-medium mb-0">Trial duration (hours)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min={0}
                    value={trialHours}
                    onChange={(e) => setTrialHours(e.target.value)}
                    placeholder="e.g. 24"
                  />
                  <div className="text-muted">
                    Length of free access before payment is required. Set to 0 to disable trials.
                  </div>
                </div>

                <div className="d-flex flex-column gap-2">
                  <label className="small fw-medium mb-0">Referral reward bonus (days)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min={0}
                    value={referralBonusDays}
                    onChange={(e) => setReferralBonusDays(e.target.value)}
                    placeholder="e.g. 7"
                  />
                  <div className="text-muted">
                    Extra subscription days for referrers when invitees make their first payment.
                    Set to 0 for no bonus.
                  </div>
                </div>

                <div className="d-flex flex-column gap-2">
                  <label className="small fw-medium mb-0">Retention discount (%)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min={0}
                    max={100}
                    value={retentionDiscount}
                    onChange={(e) => setRetentionDiscount(e.target.value)}
                    placeholder="e.g. 20"
                  />
                  <div className="text-muted">
                    Discount offered to at-risk or expiring users to encourage renewal. Set to 0 for
                    no discount.
                  </div>
                </div>

                <div className="d-flex flex-column gap-2">
                  <label className="small fw-medium mb-0">CORS allowlist (origins)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={corsAllowOrigins}
                    onChange={(e) => setCorsAllowOrigins(e.target.value)}
                    placeholder="e.g. https://vpn.example.com,https://admin.example.com"
                  />
                  <div className="text-muted">
                    Comma-separated list of browser origins allowed to call the admin API. Leave
                    empty to disable CORS (same-origin or server-side calls only).
                  </div>
                </div>

                <div className="ref-page-actions mt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => updateAppSettingsMutation.mutate()}
                    loading={updateAppSettingsMutation.isPending}
                    disabled={appSettingsLoading}
                  >
                    Save changes
                  </Button>
                </div>
              </>
            )}
          </div>
        </Panel>

        <Panel as="section" variant="outline" aria-label="Appearance">
          <div className="ref-section-head">
            <h3 className="ref-settings-title">Appearance</h3>
          </div>
          <p className="ref-settings-text">Current theme: {theme}</p>
          <div className="ref-page-actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const idx = themes.indexOf(theme);
                const next = idx >= 0 ? themes[(idx + 1) % themes.length] : themes[0];
                if (next) setTheme(next);
              }}
              aria-label="Switch theme"
            >
              Switch theme
            </Button>
          </div>
        </Panel>

        <Panel as="section" variant="outline" aria-label="Account">
          <div className="ref-section-head">
            <h3 className="ref-settings-title">Account</h3>
          </div>
          <p className="ref-settings-text">Sign out from the current admin session.</p>
          <div className="ref-page-actions">
            <Button variant="ghost" size="sm" onClick={logout}>Log out</Button>
          </div>
        </Panel>

        <Panel as="section" variant="outline" aria-label="Two-factor authentication">
          <div className="ref-section-head">
            <h3 className="ref-settings-title">Two-factor authentication (2FA)</h3>
          </div>
          <p className="ref-settings-text">Use TOTP (e.g. Google Authenticator) to secure your admin account.</p>
          <div className="ref-page-actions d-flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => totpSetupMutation.mutate()} disabled={totpSetupMutation.isPending}>Enable 2FA</Button>
            <Button variant="ghost" size="sm" onClick={() => setTotpDisableOpen(true)}>Disable 2FA</Button>
          </div>
        </Panel>

        <Panel as="section" variant="outline" aria-label="Database cleanup">
          <div className="ref-section-head">
            <h3 className="ref-settings-title">Database cleanup</h3>
          </div>
          <p className="ref-settings-text">Remove all end-user data: devices, users, subscriptions, payments, funnel events. Admin and servers are kept. Irreversible.</p>
          <div className="ref-page-actions">
            <Button variant="danger" size="sm" onClick={() => setCleanupOpen(true)} data-testid="settings-cleanup-db">
              Clean up database
            </Button>
          </div>
        </Panel>
      </div>

      <Modal
        open={totpSetupResult !== null}
        onClose={() => setTotpSetupResult(null)}
        title="2FA secret — add to your app"
        footer={<Button onClick={() => setTotpSetupResult(null)}>Done</Button>}
      >
        {totpSetupResult && (
          <div className="d-flex flex-column gap-2 small">
            <p>Add this secret to your authenticator app (e.g. Google Authenticator):</p>
            <code className="p-2 bg-light rounded break-all">{totpSetupResult.secret}</code>
            <p className="mb-0">Or open this link on the same device as your app:</p>
            <a href={totpSetupResult.provisioning_uri} target="_blank" rel="noopener noreferrer" className="break-all">{totpSetupResult.provisioning_uri}</a>
          </div>
        )}
      </Modal>
      <ConfirmModal
        open={totpDisableOpen}
        onClose={() => setTotpDisableOpen(false)}
        onConfirm={() => totpDisableMutation.mutate()}
        title="Disable 2FA"
        message="Your account will no longer require a code from your authenticator app at login."
        confirmLabel="Disable"
        cancelLabel="Cancel"
        loading={totpDisableMutation.isPending}
      />
      <ConfirmDanger
        open={cleanupOpen}
        onClose={() => setCleanupOpen(false)}
        title="Clean up database"
        message="Delete all devices, users, subscriptions, payments and related data? This cannot be undone. Admin users and servers are not removed."
        confirmTokenRequired
        confirmTokenLabel="Confirmation code"
        onConfirm={(p) => {
          if (p.confirm_token) cleanupMutation.mutate(p.confirm_token);
        }}
        confirmLabel="Clean up"
        cancelLabel="Cancel"
        loading={cleanupMutation.isPending}
      />
    </div>
  );
}
