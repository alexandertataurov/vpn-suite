import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Settings as SettingsIcon } from "lucide-react";
import { Button, Panel, ConfirmDanger, useToast } from "@vpn-suite/shared/ui";
import { useTheme } from "@vpn-suite/shared/theme";
import { useAuthStore } from "../store/authStore";
import { PageHeader } from "../components/PageHeader";
import { api } from "../api/client";

export function SettingsPage() {
  const { theme, themes, setTheme } = useTheme();
  const logout = useAuthStore((s) => s.logout);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const addToast = useToast();
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

  return (
    <div className="ref-page" data-testid="settings-page">
      <PageHeader icon={SettingsIcon} title="Settings" description="Appearance and account controls" />

      <div className="ref-page-sections">
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

      <ConfirmDanger
        open={cleanupOpen}
        onClose={() => setCleanupOpen(false)}
        title="Clean up database"
        message="Delete all devices, users, subscriptions, payments and related data? This cannot be undone. Admin users and servers are not removed."
        confirmTokenRequired
        confirmTokenLabel="Confirmation code"
        onConfirm={(p) => p.confirm_token && cleanupMutation.mutate(p.confirm_token)}
        confirmLabel="Clean up"
        cancelLabel="Cancel"
        loading={cleanupMutation.isPending}
      />
    </div>
  );
}
