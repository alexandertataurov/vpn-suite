import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/core/auth/store";

/**
 * Purpose: Redirect to login when not authenticated (programmatic guard).
 * Used in: Route wrapper or layout alongside/instead of Guard component.
 */
export function useRequireAuth(redirectTo?: string): void {
  const accessToken = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  useEffect(() => {
    if (!accessToken) {
      navigate(redirectTo ?? "/login", { replace: true });
    }
  }, [accessToken, navigate, redirectTo]);
}
