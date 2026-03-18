import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/design-system";
import { IconX } from "@/design-system/icons";
import { useSheetSwipeDismiss } from "@/design-system/hooks";
import {
  decrementBlockingOverlayCount,
  incrementBlockingOverlayCount,
} from "@/design-system/utils/overlayStack";
import "./BottomSheet.css";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface BottomSheetActions {
  primary: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    tone?: "danger" | "default" | "warning" | "success";
  };
  secondary?: { label: string; onClick: () => void };
}

export interface BottomSheetProps {
  /** @deprecated Use isOpen */
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: BottomSheetActions;
  showSwipeHint?: boolean;
}

export function BottomSheet({
  open: openLegacy,
  isOpen: isOpenProp,
  onClose,
  title,
  subtitle,
  children,
  actions,
  showSwipeHint = true,
}: BottomSheetProps) {
  const isOpen = isOpenProp ?? openLegacy ?? false;
  const theme =
    (typeof document !== "undefined" &&
      document.documentElement.dataset.theme) ??
    "dark";
  const titleId = useId();
  const bodyId = useId();
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(isOpen);
  const [phase, setPhase] = useState<"entering" | "open" | "closing">("entering");

  useEffect(() => {
    if (!isOpen) {
      setMounted(false);
      setPhase("entering");
      return;
    }
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setMounted(true);
    setPhase("entering");
    const frame = window.requestAnimationFrame(() => setPhase("open"));
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    incrementBlockingOverlayCount();
    return () => {
      document.body.style.overflow = prev;
      decrementBlockingOverlayCount();
    };
  }, [mounted]);

  const finishClose = useCallback(() => {
    restoreFocusRef.current?.focus();
    restoreFocusRef.current = null;
    onClose();
  }, [onClose]);

  const closeTimerRef = useRef<number | null>(null);

  const requestClose = useCallback(() => {
    if (phase === "closing") return;
    setPhase("closing");
    if (closeTimerRef.current != null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(finishClose, 260);
  }, [phase, finishClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mounted || phase === "closing") return;
    const dialog = sheetRef.current;
    if (!dialog) return;

    const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = focusable[0];
    window.requestAnimationFrame(() => (first ?? dialog).focus());

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = dialog.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (nodes.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      if (!firstNode || !lastNode) return;
      const active = document.activeElement;
      if (!dialog.contains(active)) {
        e.preventDefault();
        firstNode.focus();
        return;
      }
      if (e.shiftKey && active === firstNode) {
        e.preventDefault();
        lastNode.focus();
      } else if (!e.shiftKey && active === lastNode) {
        e.preventDefault();
        firstNode.focus();
      }
    };

    dialog.addEventListener("keydown", handleKeyDown);
    return () => dialog.removeEventListener("keydown", handleKeyDown);
  }, [mounted, phase, requestClose]);

  const swipeGesture = useSheetSwipeDismiss({
    enabled: mounted && phase !== "closing",
    onDismiss: requestClose,
    dismissDistance: 80,
    resolveStartContext: (target) => {
      const inHandle = target?.closest("[data-bs-handle]") != null;
      const inContent = target?.closest(".bs-content") != null;
      if (!inHandle && !inContent) return { allowStart: false };
      return {
        allowStart: true,
        scrollElement: inContent ? contentRef.current : null,
      };
    },
  });

  useEffect(() => {
    const el = sheetRef.current;
    if (!el || phase !== "open" || swipeGesture.offset <= 0) {
      el?.style.removeProperty("transform");
      return;
    }
    el.style.transform = `translateY(${swipeGesture.offset}px)`;
  }, [phase, swipeGesture.offset]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) requestClose();
    },
    [requestClose]
  );

  if (!mounted) return null;

  return createPortal(
    <div
      className="bs-overlay"
      role="presentation"
      onClick={handleOverlayClick}
      data-state={phase}
    >
      <div
        ref={sheetRef}
        className="bs"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? bodyId : undefined}
        tabIndex={-1}
        data-theme={theme}
        data-swipe-dragging={swipeGesture.isDragging ? "true" : undefined}
        {...swipeGesture.bind}
      >
        <div className="bs-handle-wrap" data-bs-handle aria-hidden>
          <div className="bs-handle" />
          {showSwipeHint && (
            <span className="bs-hint">Swipe down to dismiss</span>
          )}
        </div>

        <div className="bs-header">
          <div className="bs-header-text">
            <h2 id={titleId} className="bs-title">
              {title}
            </h2>
            {subtitle ? (
              <p id={bodyId} className="bs-subtitle">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="bs-close"
            onClick={requestClose}
            aria-label="Close"
          >
            <IconX />
          </button>
        </div>

        <div ref={contentRef} className="bs-content">
          {children}
        </div>

        {actions ? (
          <div className="bs-footer">
            <Button
              variant="primary"
              fullWidth
              tone={actions.primary.tone}
              loading={actions.primary.loading}
              onClick={actions.primary.onClick}
            >
              {actions.primary.label}
            </Button>
            {actions.secondary ? (
              <Button
                variant="secondary"
                fullWidth
                onClick={actions.secondary.onClick}
              >
                {actions.secondary.label}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
