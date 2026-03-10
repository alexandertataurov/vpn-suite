import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export interface PopoverTriggerProps {
  "aria-expanded": boolean;
  "aria-haspopup": "dialog";
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
}

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
}: PopoverProps) {
  const generatedId = useId();
  const panelId = idProp ?? `popover-${generatedId.replace(/:/g, "")}`;
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const triggerProps: PopoverTriggerProps = {
    "aria-expanded": open,
    "aria-haspopup": "dialog",
    "aria-controls": open ? panelId : undefined,
  };

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !panelRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const el = panelRef.current;
    const gutter = 12;
    const panelMaxWidth = Math.min(360, window.innerWidth - gutter * 2);
    let left = rect.left;
    if (left + panelMaxWidth > window.innerWidth - gutter) {
      left = window.innerWidth - panelMaxWidth - gutter;
    }
    if (left < gutter) {
      left = gutter;
    }
    el.style.top = `${rect.bottom}px`;
    el.style.left = `${left}px`;
  }, [open]);

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

  const triggerWithWrapper = (
    <div ref={triggerRef} className="miniapp-popover-trigger-wrap">
      {renderTrigger(triggerProps)}
    </div>
  );

  const panel = open ? (
    <div
      ref={panelRef}
      id={panelId}
      role="dialog"
      aria-label={panelAriaLabel}
      className={["miniapp-popover-panel", panelClassName].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  ) : null;

  return (
    <>
      {triggerWithWrapper}
      {panel && createPortal(panel, document.body)}
    </>
  );
}
