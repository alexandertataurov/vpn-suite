import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApi } from "@/core/api/context";
import { useAuthStore } from "@/core/auth/store";
import { Button, Input } from "@/design-system/primitives";
import { ApiError } from "@/shared/types/api-error";

export function LoginPage() {
  const api = useApi();
  const setTokens = useAuthStore((s) => s.setTokens);
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

  const handleSubmit = useCallback(
    async () => {
      setError(null);
      setLoading(true);
      try {
        const res = await api.post<{ access_token: string; refresh_token: string }>("/auth/login", {
          email: email.trim(),
          password,
        });
        if (res?.access_token && res?.refresh_token) {
          setTokens(res.access_token, res.refresh_token);
          navigate(from, { replace: true });
        } else {
          setError("Invalid response from server.");
        }
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : null;
        const suggestion = " Check your email and password, then try again.";
        setError(msg && msg.length > 0 ? `${msg}${suggestion}` : `Sign in failed.${suggestion}`);
      } finally {
        setLoading(false);
      }
    },
    [api, email, from, navigate, password, setTokens]
  );

  return (
    <div className="page login-page">
      <h1 className="login-page__title type-display-sm">VPN Suite Admin</h1>
      <h2 className="login-page__subtitle type-h3">Sign in</h2>
      <div className="login-page__form" role="form" aria-label="Sign in">
        <label className="login-page__label type-body-sm" htmlFor="login-email">
          Email
        </label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          aria-invalid={error ? true : undefined}
          describedById={error ? "login-error" : undefined}
        />
        <label className="login-page__label type-body-sm" htmlFor="login-password">
          Password
        </label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
          aria-invalid={error ? true : undefined}
          describedById={error ? "login-error" : undefined}
        />
        {error && (
          <p id="login-error" className="login-page__error type-body-sm" role="alert">
            {error}
          </p>
        )}
        <Button type="button" onClick={handleSubmit} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </div>
    </div>
  );
}
