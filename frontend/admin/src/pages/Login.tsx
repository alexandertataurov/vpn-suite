import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Input, Panel } from "@vpn-suite/shared/ui";
import { useAuthStore } from "../store/authStore";
import { api } from "../api/client";
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
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page" data-console="operator" data-testid="login-page">
      <Panel className="login-card">
        <h1>VPN Suite Admin</h1>
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
      </Panel>
    </div>
  );
}
