import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type ToastVariant = "info" | "success" | "warning" | "danger";

export interface ToastOptions {
  variant?: ToastVariant;
  title: string;
  description?: string;
  /**
   * If true, do not auto-dismiss. Recommended for warning/danger.
   */
  persistent?: boolean;
  id?: string;
}

interface ToastInternal extends ToastOptions {
  id: string;
  removing?: boolean;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, string> = {
  info: "i",
  success: "✓",
  warning: "!",
  danger: "×",
};

const LABELS: Record<ToastVariant, string> = {
  info: "Notice",
  success: "Success",
  warning: "Warning",
  danger: "Critical",
};

let toastIdCounter = 0;
const AUTO_DISMISS_MS = 5000;
const EXIT_ANIMATION_MS = 220;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);
  const timeoutIdsRef = useRef<Map<string, number>>(new Map());

  const clearToastTimeout = useCallback((id: string) => {
    const timeoutId = timeoutIdsRef.current.get(id);
    if (timeoutId === undefined) return;
    window.clearTimeout(timeoutId);
    timeoutIdsRef.current.delete(id);
  }, []);

  const dismissToast = useCallback((id: string) => {
    clearToastTimeout(id);
    setToasts((current) => current.map((toast) => (
      toast.id === id ? { ...toast, removing: true } : toast
    )));
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current.delete(id);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, EXIT_ANIMATION_MS);
    timeoutIdsRef.current.set(id, timeoutId);
  }, [clearToastTimeout]);

  useEffect(() => () => {
    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIdsRef.current.clear();
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = options.id ?? `toast-${++toastIdCounter}`;
      const variant: ToastVariant = options.variant ?? "info";
      clearToastTimeout(id);
      const toast: ToastInternal = {
        ...options,
        id,
        variant,
        removing: false,
      };

      setToasts((current) => [...current.filter((entry) => entry.id !== id), toast]);

      const shouldAutoDismiss = !options.persistent && (variant === "info" || variant === "success");
      if (shouldAutoDismiss) {
        const timeoutId = window.setTimeout(() => {
          dismissToast(id);
        }, AUTO_DISMISS_MS);
        timeoutIdsRef.current.set(id, timeoutId);
      }
    },
    [clearToastTimeout, dismissToast]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      dismissToast,
    }),
    [showToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-label="Notifications" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const showProgress = toast.variant === "info" || toast.variant === "success";
          const isAlert = toast.variant === "danger" || toast.variant === "warning";
          return (
            <div
              key={toast.id}
              className={["toast", toast.variant, toast.removing ? "removing" : ""].filter(Boolean).join(" ")}
              data-has-description={toast.description ? "true" : "false"}
              data-persistent={toast.persistent ? "true" : "false"}
              role={isAlert ? "alert" : "status"}
              aria-live={isAlert ? "assertive" : "polite"}
            >
              <span className="toast-rail" aria-hidden="true" />
              <span className="toast-icon-shell" aria-hidden="true">
                <span className="toast-icon">{ICONS[toast.variant ?? "info"]}</span>
              </span>
              <div className="toast-body">
                <div className="toast-meta">
                  <span className="toast-label">{LABELS[toast.variant ?? "info"]}</span>
                  {toast.persistent ? <span className="toast-pin">Pinned</span> : null}
                </div>
                <div className="toast-head">
                  <div className="toast-title">{toast.title}</div>
                  <button
                    type="button"
                    className="toast-close"
                    aria-label="Dismiss notification"
                    onClick={() => dismissToast(toast.id)}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                {toast.description && <div className="toast-desc">{toast.description}</div>}
                {showProgress && (
                  <div className="toast-progress" aria-hidden="true">
                    <div className="toast-progress-bar" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>.");
  }
  return ctx;
}
