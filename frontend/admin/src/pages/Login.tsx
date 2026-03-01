import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Input, Card } from "@/design-system";
import { Heading } from "@/design-system";
import { FormPage } from "../templates/FormPage";
import { useAuthStore } from "../store/authStore";
import { api } from "../api/client";
import { track } from "../telemetry";
import { getErrorMessage, type TokenResponse } from "@vpn-suite/shared";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setTokens = useAuthStore((s) => s.setTokens);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post<TokenResponse>("/auth/login", { email, password });
      setTokens(data.access_token, data.refresh_token);
      try {
        track("login_success", { route: "/login" });
        track("user_action", { action_type: "login_success" });
      } catch {
        /* noop */
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
      try {
        track("login_failure", {
          route: "/login",
          reason: getErrorMessage(err, "Login failed"),
        });
      } catch {
        /* noop */
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormPage className="ref-page login-page" data-testid="login-page" title="LOGIN" description="Authenticate to access the admin console.">
      <div className="page-content" data-console="operator">
        <Card className="login-card">
          <Heading level={1}>VPN Suite Admin</Heading>
          <form onSubmit={handleSubmit} aria-label="Sign in" data-testid="login-form">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error ? <p className="login-error" role="alert">{error}</p> : null}
            <Button type="submit" loading={loading}>
              Sign in
            </Button>
          </form>
        </Card>
      </div>
    </FormPage>
  );
}
