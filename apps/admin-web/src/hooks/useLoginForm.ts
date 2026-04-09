import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApi } from "@/core/api/context";
import { useAuthStore } from "@/core/auth/store";
import { ApiError } from "@vpn-suite/shared";

/**
 * Purpose: Login form state and submit; matches LoginPage behavior.
 * Used in: LoginPage (can replace local state).
 */
export function useLoginForm(): {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  error: string | null;
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
} {
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
    async (e: React.FormEvent) => {
      e.preventDefault();
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
        setError(err instanceof ApiError ? err.message : "Sign in failed. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [api, email, from, navigate, password, setTokens]
  );

  return { email, setEmail, password, setPassword, error, loading, handleSubmit };
}
