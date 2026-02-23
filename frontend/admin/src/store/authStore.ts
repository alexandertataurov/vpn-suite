import { create } from "zustand";
import { ADMIN_BASE } from "../config";

const ACCESS_KEY = "vpn_admin_access";
const REFRESH_KEY = "vpn_admin_refresh";

function getStored(): { accessToken: string; refreshToken: string } | null {
  try {
    const a = sessionStorage.getItem(ACCESS_KEY);
    const r = sessionStorage.getItem(REFRESH_KEY);
    if (a && r) return { accessToken: a, refreshToken: r };
  } catch {
    /* ignore */
  }
  return null;
}

function setStored(access: string, refresh: string) {
  try {
    sessionStorage.setItem(ACCESS_KEY, access);
    sessionStorage.setItem(REFRESH_KEY, refresh);
  } catch {
    /* ignore */
  }
}

function clearStored() {
  try {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: getStored()?.accessToken ?? null,
  refreshToken: getStored()?.refreshToken ?? null,
  setTokens: (access, refresh) => {
    setStored(access, refresh);
    set({ accessToken: access, refreshToken: refresh });
  },
  logout: () => {
    clearStored();
    set({ accessToken: null, refreshToken: null });
    if (typeof window !== "undefined") {
      window.location.href = `${ADMIN_BASE}/login`;
    }
  },
  getAccessToken: () => get().accessToken,
  getRefreshToken: () => get().refreshToken,
}));
