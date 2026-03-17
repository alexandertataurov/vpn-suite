import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@vpn-suite/shared";
import { usePrefersReducedMotion } from "@/design-system/hooks";
import { getMotionDurationMs } from "@/design-system/core/tokens";

export type ToastVariant = "success" | "error" | "info" | "persistent";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
  dismissible: boolean;
  exiting?: boolean;
}

export interface ToastInput {
  id?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  dismissible?: boolean;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (input: string | ToastInput, variant?: Exclude<ToastVariant, "persistent">, duration?: number) => void;
  removeToast: (id: string) => void;
}

const MAX_VISIBLE_TOASTS = 3;
const ToastContext = createContext<ToastContextValue | null>(null);

const defaultDuration: Record<ToastVariant, number> = {
  success: 4000,
  error: 8000,
  info: 5000,
  persistent: 0,
};

const defaultDismissible: Record<ToastVariant, boolean> = {
  success: false,
  error: true,
  info: false,
  persistent: true,
};

export function ToastContainer({ children }: { children: ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const exitDurationMs = getMotionDurationMs("exit", prefersReducedMotion);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutIdsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearToastTimeout = useCallback((id: string) => {
    const timeoutId = timeoutIdsRef.current.get(id);
    if (!timeoutId) return;
    clearTimeout(timeoutId);
    timeoutIdsRef.current.delete(id);
  }, []);

  const scheduleRemoval = useCallback((id: string, duration: number) => {
    if (duration <= 0) return;
    clearToastTimeout(id);
    const timeoutId = setTimeout(() => {
      timeoutIdsRef.current.delete(id);
      setToasts((current) => current.map((toast) => (
        toast.id === id ? { ...toast, exiting: true } : toast
      )));
      const exitTimeoutId = setTimeout(() => {
        timeoutIdsRef.current.delete(id);
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, exitDurationMs);
      timeoutIdsRef.current.set(id, exitTimeoutId);
    }, duration);
    timeoutIdsRef.current.set(id, timeoutId);
  }, [clearToastTimeout, exitDurationMs]);

  useEffect(() => {
    const ref = timeoutIdsRef;
    return () => {
      ref.current.forEach((timeoutId) => clearTimeout(timeoutId));
      ref.current.clear();
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    clearToastTimeout(id);
    setToasts((current) => current.map((toast) => (
      toast.id === id ? { ...toast, exiting: true } : toast
    )));
    const timeoutId = setTimeout(() => {
      timeoutIdsRef.current.delete(id);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, exitDurationMs);
    timeoutIdsRef.current.set(id, timeoutId);
  }, [clearToastTimeout, exitDurationMs]);

  const addToast = useCallback<ToastContextValue["addToast"]>((input, legacyVariant = "info", legacyDuration) => {
    const payload: ToastInput = typeof input === "string"
      ? { message: input, variant: legacyVariant, duration: legacyDuration }
      : input;
    const variant = payload.variant ?? "info";
    const id = payload.id ?? `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = payload.duration ?? defaultDuration[variant];
    const dismissible = payload.dismissible ?? defaultDismissible[variant];

    setToasts((current) => {
      const nextToast: ToastItem = {
        id,
        message: payload.message,
        variant,
        duration,
        dismissible,
        exiting: false,
      };
      const withoutDuplicate = current.filter((toast) => toast.id !== id);
      const nextToasts = [nextToast, ...withoutDuplicate].slice(0, MAX_VISIBLE_TOASTS);
      withoutDuplicate
        .filter((toast) => !nextToasts.some((candidate) => candidate.id === toast.id))
        .forEach((toast) => clearToastTimeout(toast.id));
      return nextToasts;
    });

    scheduleRemoval(id, duration);
  }, [clearToastTimeout, scheduleRemoval]);

  const value = useMemo(
    () => ({ toasts, addToast, removeToast }),
    [toasts, addToast, removeToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function ToastViewport({
  toasts,
  onDismiss,
  className = "",
}: {
  toasts: ToastItem[];
  onDismiss?: (id: string) => void;
  className?: string;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className={cn("toast-container", className)} aria-live="polite" aria-atomic="false">
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          {...toast}
          stackIndex={index}
          stackCount={toasts.length}
          onDismiss={onDismiss ? () => onDismiss(toast.id) : undefined}
        />
      ))}
    </div>
  );
}

export function Toast({
  message,
  variant = "info",
  duration,
  dismissible,
  exiting = false,
  onDismiss,
  stackIndex = 0,
  stackCount = 1,
  className = "",
}: {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  dismissible?: boolean;
  exiting?: boolean;
  onDismiss?: () => void;
  stackIndex?: number;
  stackCount?: number;
  className?: string;
}) {
  const resolvedDuration = duration ?? defaultDuration[variant];
  const resolvedDismissible = dismissible ?? defaultDismissible[variant];

  return (
    <div
      className={cn(
        "toast",
        `toast-${variant}`,
        resolvedDuration > 0 && `toast-duration-${resolvedDuration}`,
        exiting ? "toast-exit" : "toast-enter",
        className,
      )}
      data-stack-index={stackIndex}
      data-stack-count={stackCount}
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
    >
      <div className="toast-content">
        <span className="toast-icon" aria-hidden />
        <span className="toast-message">{message}</span>
      </div>
      {resolvedDismissible ? (
        <button
          type="button"
          className="toast-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      ) : null}
      {resolvedDuration > 0 ? (
        <span className="toast-progress" aria-hidden>
          <span className="toast-progress-bar" />
        </span>
      ) : null}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastContainer");
  return ctx;
}
