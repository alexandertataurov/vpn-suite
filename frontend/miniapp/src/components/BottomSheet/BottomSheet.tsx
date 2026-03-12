import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/design-system";
import { cn } from "@vpn-suite/shared";
import styles from "./BottomSheet.module.css";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const DISMISS_MS = 400;
const SWIPE_THRESHOLD = 80;

export interface BottomSheetProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  bodyText?: string;
  scrollContent?: ReactNode;
  statusText?: string;
  primaryLabel: string;
  primaryIcon?: ReactNode;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  onClose: () => void;
  open: boolean;
}

function DefaultCheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 10.5L8.25 13.75L15 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M6 6L14 14M14 6L6 14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BottomSheet({
  title,
  subtitle,
  icon,
  bodyText,
  scrollContent,
  statusText,
  primaryLabel,
  primaryIcon,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose,
  open,
}: BottomSheetProps) {
  const titleId = useId();
  const bodyId = useId();
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const dismissTimerRef = useRef<number | null>(null);
  const swipeStartYRef = useRef<number | null>(null);
  const swipeActiveRef = useRef(false);
  const scrollTopAtStartRef = useRef(0);
  const scrollAreaRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(open);
  const [phase, setPhase] = useState<"entering" | "open" | "closing">("entering");

  const resolvedPrimaryIcon = useMemo(() => primaryIcon ?? <DefaultCheckIcon />, [primaryIcon]);

  useEffect(() => {
    if (!open) {
      setMounted(false);
      setPhase("entering");
      if (dismissTimerRef.current != null) {
        window.clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      return;
    }

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setMounted(true);
    setPhase("entering");

    const frame = window.requestAnimationFrame(() => {
      setPhase("open");
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || phase === "closing") {
      return;
    }

    const dialog = sheetRef.current;
    if (!dialog) {
      return;
    }

    const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = focusable[0];
    window.requestAnimationFrame(() => {
      (first ?? dialog).focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const nodes = dialog.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (nodes.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      if (firstNode == null || lastNode == null) {
        return;
      }
      const activeElement = document.activeElement;

      if (!dialog.contains(activeElement)) {
        event.preventDefault();
        firstNode.focus();
        return;
      }

      if (event.shiftKey && activeElement === firstNode) {
        event.preventDefault();
        lastNode.focus();
      }

      if (!event.shiftKey && activeElement === lastNode) {
        event.preventDefault();
        firstNode.focus();
      }
    };

    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted, phase]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current != null) {
        window.clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  function finishClose() {
    restoreFocusRef.current?.focus();
    restoreFocusRef.current = null;
    dismissTimerRef.current = null;
    onClose();
  }

  function requestClose() {
    if (phase === "closing") {
      return;
    }

    setPhase("closing");
    dismissTimerRef.current = window.setTimeout(finishClose, DISMISS_MS);
  }

  function resetSwipeTracking() {
    swipeStartYRef.current = null;
    swipeActiveRef.current = false;
    scrollTopAtStartRef.current = 0;
    scrollAreaRef.current = null;
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (phase === "closing") {
      return;
    }

    const touch = event.touches[0];
    if (touch == null) {
      return;
    }
    swipeStartYRef.current = touch.clientY;
    const scrollArea = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      "[data-bottom-sheet-scroll-area='true']",
    );
    scrollAreaRef.current = scrollArea ?? null;
    scrollTopAtStartRef.current = scrollArea?.scrollTop ?? 0;
    swipeActiveRef.current = scrollArea == null || scrollTopAtStartRef.current <= 0;
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (!swipeActiveRef.current || swipeStartYRef.current == null) {
      return;
    }

    const touch = event.touches[0];
    if (touch == null) {
      return;
    }
    const deltaY = touch.clientY - swipeStartYRef.current;
    const scrollArea = scrollAreaRef.current;

    if (scrollArea != null && scrollArea.scrollTop > 0) {
      swipeActiveRef.current = false;
      return;
    }

    if (deltaY > 0) {
      event.preventDefault();
    }
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (!swipeActiveRef.current || swipeStartYRef.current == null) {
      resetSwipeTracking();
      return;
    }

    const touch = event.changedTouches[0];
    if (touch == null) {
      resetSwipeTracking();
      return;
    }
    const deltaY = touch.clientY - swipeStartYRef.current;
    resetSwipeTracking();

    if (deltaY > SWIPE_THRESHOLD) {
      requestClose();
    }
  }

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className={styles.overlay}
      data-state={phase}
      role="presentation"
    >
      <div
        ref={sheetRef}
        className={cn(styles.sheet, phase === "closing" && styles.sheetClosing)}
        data-state={phase}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyText ? bodyId : undefined}
        tabIndex={-1}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.dragHandleWrap} aria-hidden="true">
          <div className={styles.dragHandle} />
        </div>

        <div className={styles.header}>
          <div className={styles.headerIdentity}>
            <div className={styles.iconWrap} aria-hidden="true">
              {icon}
            </div>
            <div className={styles.titleBlock}>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={requestClose}
            aria-label="Close sheet"
          >
            <span className={styles.closeButtonIcon}>
              <CloseIcon />
            </span>
          </button>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.body}>
          {bodyText ? (
            <p id={bodyId} className={styles.bodyText}>
              {bodyText}
            </p>
          ) : null}

          {scrollContent ? (
            <div className={styles.scrollBlock}>
              <div className={styles.contextLabel}>CONTEXTUAL</div>
              <div
                className={styles.scrollArea}
                data-bottom-sheet-scroll-area="true"
              >
                <div className={styles.scrollContent}>{scrollContent}</div>
              </div>
            </div>
          ) : null}

          {statusText ? (
            <div className={styles.statusPill}>
              <span className={styles.statusDot} aria-hidden="true" />
              <span>{statusText}</span>
            </div>
          ) : null}
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.footer}>
          <div className={styles.swipeHint}>↓ swipe to dismiss</div>
          <div className={styles.buttonStack}>
            <Button
              variant="primary"
              fullWidth
              className={cn(styles.actionButton, styles.primaryButton)}
              onClick={onPrimary}
              startIcon={resolvedPrimaryIcon}
            >
              {primaryLabel}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              className={cn(styles.actionButton, styles.secondaryButton)}
              onClick={onSecondary}
            >
              {secondaryLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
