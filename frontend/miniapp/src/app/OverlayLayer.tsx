import type { ReactNode } from "react";
import { ToastContainer } from "../ui";

/**
 * Production layer: system UI above layout (toasts, modals, drawers, loaders).
 */
export function OverlayLayer({ children }: { children: ReactNode }) {
  return <ToastContainer>{children}</ToastContainer>;
}
