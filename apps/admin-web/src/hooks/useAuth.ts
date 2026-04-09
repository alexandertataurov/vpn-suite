import { useAuthStore } from "@/core/auth/store";

/**
 * Purpose: Expose auth state and logout; no login (handled by LoginPage with api.post).
 * Used in: Guard, layout, any component that needs isAuthenticated or logout.
 */
export function useAuth(): {
  user: { accessToken: string } | null;
  logout: () => void;
  isAuthenticated: boolean;
} {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  return {
    user: accessToken ? { accessToken } : null,
    logout,
    isAuthenticated: !!accessToken,
  };
}
