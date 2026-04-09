import {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useSheetSwipeDismiss } from "@/design-system/hooks";
import { decrementBlockingOverlayCount, incrementBlockingOverlayCount } from "@/design-system/utils/overlayStack";
import { useTelegramHaptics } from "@/hooks";

export interface PopoverTriggerProps {
  "aria-expanded": boolean;
  "aria-haspopup": "dialog" | "menu";
  "aria-controls"?: string;
  id?: string;
}

export interface PopoverProps {
  /** Render prop for trigger (e.g. bell button). Receives a11y props. */
  renderTrigger: (props: PopoverTriggerProps) => ReactNode;
  /** Content shown when open. */
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional id for the popover panel. */
  id?: string;
  panelClassName?: string;
  panelAriaLabel?: string;
  panelRole?: "dialog" | "menu";
  triggerHasPopup?: "dialog" | "menu";
  autoDismiss?: number;
  autoDismissOnInteraction?: boolean;
  preferredPlacement?: "bottom-start" | "bottom-end";
  trapFocus?: boolean;
}

const MOBILE_SHEET_MAX_WIDTH = 480;
const PANEL_GAP = 10;
const PANEL_GUTTER = 16;
const SINGLE_OPEN_EVENT = "miniapp:popover-open";
const POPOVER_EXIT_DURATION_MS = 180;

/**
 * Minimal popover: trigger + panel in portal. Click outside and Escape close.
 * Panel is positioned below the trigger using getBoundingClientRect.
 */
export function Popover({
  renderTrigger,
  children,
  open,
  onOpenChange,
  id: idProp,
  panelClassName,
  panelAriaLabel,
  panelRole = "dialog",
  triggerHasPopup = "dialog",
  autoDismiss,
  autoDismissOnInteraction = false,
  preferredPlacement = "bottom-start",
  trapFocus = false,
}: PopoverProps) {
  const { selectionChanged } = useTelegramHaptics();
  const generatedId = useId();
  const panelId = idProp ?? `popover-${generatedId.replace(/:/g, "")}`;
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(open);
  const [isMobileSheet, setIsMobileSheet] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < MOBILE_SHEET_MAX_WIDTH : false,
  );
  const [rendered, setRendered] = useState(open);
  const [layout, setLayout] = useState({
    top: 0,
    left: 0,
    placement: "bottom-start" as "bottom-start" | "bottom-end" | "top-start" | "top-end",
    caretLeft: 24,
  });
  const [dismissCycle, setDismissCycle] = useState(0);
  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);
  const swipeGesture = useSheetSwipeDismiss({
    enabled: open && isMobileSheet,
    onDismiss: close,
    resolveStartContext: (target) => {
      const startedInHandle = target?.closest(".miniapp-popover-sheet-handle") != null;
      const startedInSheet = target?.closest(".miniapp-popover-panel--sheet") != null;
      if (!startedInHandle && !startedInSheet) {
        return { allowStart: false };
      }
      return {
        allowStart: true,
        scrollElement: startedInSheet ? panelRef.current : null,
      };
    },
  });

  const triggerProps: PopoverTriggerProps = {
    "aria-expanded": open,
    "aria-haspopup": triggerHasPopup,
    "aria-controls": open ? panelId : undefined,
    id: `${panelId}-trigger`,
  };

  const restartAutoDismiss = useCallback(() => {
    if (!open || !autoDismiss || !autoDismissOnInteraction) return;
    setDismissCycle((current) => current + 1);
  }, [autoDismiss, autoDismissOnInteraction, open]);

  useEffect(() => {
    if (open) {
      setRendered(true);
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setRendered(false);
    }, POPOVER_EXIT_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_SHEET_MAX_WIDTH - 1}px)`);
    const handleChange = () => setIsMobileSheet(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useLayoutEffect(() => {
    if (!open || isMobileSheet || !triggerRef.current || !panelRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const el = panelRef.current;
    const panelWidth = Math.min(
      Math.max(el.offsetWidth, 180),
      Math.min(320, window.innerWidth - PANEL_GUTTER * 2),
    );
    const panelHeight = el.offsetHeight;
    const fitsBelow = rect.bottom + PANEL_GAP + panelHeight <= window.innerHeight - PANEL_GUTTER;
    const fitsAbove = rect.top - PANEL_GAP - panelHeight >= PANEL_GUTTER;
    const placeBelow = fitsBelow || !fitsAbove;
    const preferEnd = preferredPlacement.endsWith("end");
    const fitsEnd = rect.right - panelWidth >= PANEL_GUTTER;
    const fitsStart = rect.left + panelWidth <= window.innerWidth - PANEL_GUTTER;
    const alignEnd = preferEnd ? (fitsEnd || !fitsStart) : !(fitsStart || !fitsEnd);
    const unclampedLeft = alignEnd ? rect.right - panelWidth : rect.left;
    const left = Math.min(
      Math.max(PANEL_GUTTER, unclampedLeft),
      Math.max(PANEL_GUTTER, window.innerWidth - panelWidth - PANEL_GUTTER),
    );
    const top = placeBelow
      ? Math.min(window.innerHeight - panelHeight - PANEL_GUTTER, rect.bottom + PANEL_GAP)
      : Math.max(PANEL_GUTTER, rect.top - panelHeight - PANEL_GAP);
    const caretLeft = Math.min(panelWidth - 18, Math.max(18, rect.left + rect.width / 2 - left));

    setLayout({
      top,
      left,
      placement: `${placeBelow ? "bottom" : "top"}-${alignEnd ? "end" : "start"}`,
      caretLeft,
    });
  }, [isMobileSheet, open, preferredPlacement]);

  useLayoutEffect(() => {
    if (!panelRef.current) return;
    if (!open || isMobileSheet) {
      panelRef.current.style.removeProperty("top");
      panelRef.current.style.removeProperty("left");
      panelRef.current.style.removeProperty("--popover-caret-left");
      return;
    }

    panelRef.current.style.top = `${layout.top}px`;
    panelRef.current.style.left = `${layout.left}px`;
    panelRef.current.style.setProperty("--popover-caret-left", `${layout.caretLeft}px`);
  }, [isMobileSheet, layout.caretLeft, layout.left, layout.top, open]);

  useLayoutEffect(() => {
    if (!panelRef.current) return;
    if (!open || !isMobileSheet || swipeGesture.offset <= 0) {
      panelRef.current.style.removeProperty("transform");
      return;
    }

    panelRef.current.style.transform = `translateY(${swipeGesture.offset}px)`;
  }, [isMobileSheet, open, swipeGesture.offset]);

  useEffect(() => {
    if (!panelRef.current) return;
    if (open && autoDismiss && autoDismiss > 0) {
      panelRef.current.style.setProperty("--miniapp-popover-auto-dismiss", `${autoDismiss}ms`);
      return;
    }
    panelRef.current.style.removeProperty("--miniapp-popover-auto-dismiss");
  }, [autoDismiss, open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      selectionChanged();
    }
    wasOpenRef.current = open;
  }, [open, selectionChanged]);

  useEffect(() => {
    if (!open) return;
    const handleOtherOpen = (event: Event) => {
      const nextId = (event as CustomEvent<string>).detail;
      if (nextId && nextId !== panelId) {
        onOpenChange(false);
      }
    };
    window.addEventListener(SINGLE_OPEN_EVENT, handleOtherOpen as EventListener);
    window.dispatchEvent(new CustomEvent(SINGLE_OPEN_EVENT, { detail: panelId }));
    return () => window.removeEventListener(SINGLE_OPEN_EVENT, handleOtherOpen as EventListener);
  }, [onOpenChange, open, panelId]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    incrementBlockingOverlayCount();
    return () => {
      document.body.style.overflow = previousOverflow;
      decrementBlockingOverlayCount();
    };
  }, [isMobileSheet, open]);

  useEffect(() => {
    if (!open || !autoDismiss || autoDismiss <= 0) return undefined;
    const timer = window.setTimeout(() => close(), autoDismiss);
    return () => window.clearTimeout(timer);
  }, [autoDismiss, close, dismissCycle, open]);

  useEffect(() => {
    if (!open || !panelRef.current) return undefined;
    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    const firstFocusable = focusables[0] ?? panelRef.current;
    window.setTimeout(() => firstFocusable.focus(), 0);

    return () => {
      previouslyFocusedRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open || !trapFocus || !panelRef.current) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, trapFocus]);

  const triggerWithWrapper = (
    <div ref={triggerRef} className="miniapp-popover-trigger-wrap">
      {renderTrigger(triggerProps)}
    </div>
  );

  const panel = rendered ? (
    <>
      <div
        className={`miniapp-popover-overlay ${open ? "miniapp-popover-overlay-enter" : "miniapp-popover-overlay-exit"}`}
        data-mode={isMobileSheet ? "sheet" : "floating"}
        data-swipe-active={swipeGesture.isDragging ? "true" : "false"}
        data-swipe-ready={swipeGesture.isReady ? "true" : "false"}
        aria-hidden
        onClick={open ? close : undefined}
      />
      <div
        ref={panelRef}
        id={panelId}
        role={panelRole}
        aria-label={panelAriaLabel}
        tabIndex={-1}
        data-mode={isMobileSheet ? "sheet" : "floating"}
        data-placement={layout.placement}
        data-swipe-state={swipeGesture.isDragging ? "dragging" : "idle"}
        data-swipe-ready={swipeGesture.isReady ? "true" : "false"}
        className={[
          "miniapp-popover-panel",
          open ? "miniapp-popover-panel-enter" : "miniapp-popover-panel-exit",
          isMobileSheet && "miniapp-popover-panel--sheet",
          panelClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        onPointerDown={restartAutoDismiss}
        onPointerEnter={restartAutoDismiss}
        {...(isMobileSheet ? swipeGesture.bind : {})}
      >
        {isMobileSheet ? <div className="miniapp-popover-sheet-handle" aria-hidden /> : null}
        {!isMobileSheet ? <div className="miniapp-popover-caret" aria-hidden /> : null}
        {children}
        {autoDismiss ? (
          <div className="miniapp-popover-progress" aria-hidden>
            <span key={dismissCycle} className="miniapp-popover-progress-bar" />
          </div>
        ) : null}
      </div>
    </>
  ) : null;

  return (
    <>
      {triggerWithWrapper}
      {panel && createPortal(panel, document.body)}
    </>
  );
}
