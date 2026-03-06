import { useCallback, useState } from "react";

export interface ToastMessage {
  id: string;
  message: string;
  tone?: "info" | "success" | "warning" | "error";
  ttlMs?: number;
}

function createToastId() {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useToastManager() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastMessage["tone"] = "info", ttlMs = 2800) => {
      const id = createToastId();
      const toast: ToastMessage = { id, message, tone, ttlMs };
      setToasts((prev) => [...prev, toast]);
      if (ttlMs > 0) {
        window.setTimeout(() => removeToast(id), ttlMs);
      }
      return id;
    },
    [removeToast],
  );

  return { toasts, showToast, removeToast };
}

