import { Link } from "react-router-dom";
import { Settings as SettingsIcon, Shield } from "lucide-react";
import { Button, Panel } from "@vpn-suite/shared/ui";
import { useTheme } from "@vpn-suite/shared/theme";
import { useAuthStore } from "../store/authStore";
import { PageHeader } from "../components/PageHeader";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="ref-page" data-testid="settings-page">
      <PageHeader icon={SettingsIcon} title="Settings" description="Appearance and account controls" />

      <Panel as="section" variant="outline">
        <h3 className="ref-settings-title">Integrations</h3>
        <p className="ref-settings-text">Connect external services to the admin dashboard.</p>
        <div className="ref-page-actions">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/integrations/outline" className="inline-flex items-center gap-2">
              <Shield aria-hidden /> Outline
            </Link>
          </Button>
        </div>
      </Panel>

      <Panel as="section" variant="outline">
        <h3 className="ref-settings-title">Appearance</h3>
        <p className="ref-settings-text">Current theme: {theme}</p>
        <div className="ref-page-actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
          </Button>
        </div>
      </Panel>

      <Panel as="section" variant="outline">
        <h3 className="ref-settings-title">Account</h3>
        <p className="ref-settings-text">Sign out from the current admin session.</p>
        <div className="ref-page-actions">
          <Button variant="ghost" size="sm" onClick={logout}>Log out</Button>
        </div>
      </Panel>
    </div>
  );
}
