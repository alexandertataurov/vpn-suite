import { ONBOARDING_MAX_STEP, ONBOARDING_MIN_STEP } from "./constants";

const STORAGE_PREFIX = "vpn-suite-miniapp-onboarding";

export interface OnboardingResumeState {
  step: number;
  version: number;
  completed: boolean;
  updatedAt: string;
}

function getStorageKey(userId?: number | null): string {
  const suffix = userId != null ? String(userId) : "anonymous";
  return `${STORAGE_PREFIX}:${suffix}`;
}

function clampStep(step: number): number {
  return Math.max(ONBOARDING_MIN_STEP, Math.min(ONBOARDING_MAX_STEP, step));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function loadOnboardingResume(userId?: number | null): OnboardingResumeState | null {
  if (typeof window === "undefined") return null;
  const key = getStorageKey(userId);
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!isObject(parsed)) throw new Error("Invalid onboarding resume shape");
    const stepRaw = parsed.step;
    const versionRaw = parsed.version;
    const updatedAtRaw = parsed.updatedAt;
    const completedRaw = parsed.completed;
    if (
      typeof stepRaw !== "number" ||
      typeof versionRaw !== "number" ||
      typeof updatedAtRaw !== "string" ||
      typeof completedRaw !== "boolean"
    ) {
      throw new Error("Invalid onboarding resume value types");
    }
    const step = clampStep(stepRaw);
    const version = Math.max(1, Math.trunc(versionRaw));
    return { step, version, completed: completedRaw, updatedAt: updatedAtRaw };
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function saveOnboardingResume(
  userId: number | null | undefined,
  state: { step: number; version: number; completed?: boolean },
): void {
  if (typeof window === "undefined") return;
  const key = getStorageKey(userId);
  const payload: OnboardingResumeState = {
    step: clampStep(state.step),
    version: Math.max(1, Math.trunc(state.version)),
    completed: !!state.completed,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(key, JSON.stringify(payload));
}

export function clearOnboardingResume(userId?: number | null): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getStorageKey(userId));
}
