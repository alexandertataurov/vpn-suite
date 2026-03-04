import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

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
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, string> = {
  info: "ℹ",
  success: "✓",
  warning: "⚠",
  danger: "✕",
};

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = options.id ?? `toast-${++toastIdCounter}`;
      const variant: ToastVariant = options.variant ?? "info";
      const toast: ToastInternal = {
        ...options,
        id,
        variant,
      };

      setToasts((current) => [...current, toast]);

      const shouldAutoDismiss = !options.persistent && (variant === "info" || variant === "success");
      if (shouldAutoDismiss) {
        window.setTimeout(() => {
          dismissToast(id);
        }, 5000);
      }
    },
    [dismissToast]
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
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => {
          const showProgress = toast.variant === "info" || toast.variant === "success";
          return (
            <div key={toast.id} className={["toast", toast.variant].join(" ")}>
              <span className="toast-icon" aria-hidden="true">
                {ICONS[toast.variant ?? "info"]}
              </span>
              <div className="toast-body">
                <div className="toast-title">{toast.title}</div>
                {toast.description && <div className="toast-desc">{toast.description}</div>}
              </div>
              <button
                type="button"
                className="toast-close"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(toast.id)}
              >
                ×
              </button>
              {showProgress && (
                <div className="toast-progress">
                  <div className="toast-progress-bar" style={{ animationDuration: "4s" }} />
                </div>
              )}
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

