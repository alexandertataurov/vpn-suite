import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@vpn-suite/shared";

export interface TooltipProps {
  content: ReactNode;
  children: React.ReactElement;
  delay?: number;
  className?: string;
}

const DEFAULT_DELAY = 400;

export function Tooltip({ content, children, delay = DEFAULT_DELAY, className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const anchorRef = useRef<HTMLElement | null>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback(() => {
    showTimeoutRef.current = setTimeout(() => {
      if (anchorRef.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        setCoords({ x: rect.left + rect.width / 2, y: rect.top });
        setVisible(true);
      }
    }, delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    setVisible(false);
  }, []);

  useEffect(() => () => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
  }, []);

  const child = children && typeof children === "object" && "ref" in children
    ? children
    : children;

  return (
    <>
      {typeof child === "object" && child !== null
        ? (
            (child as React.ReactElement).type
              ? (
                  // Clone to add ref and handlers
                  (() => {
                    const el = child as React.ReactElement<{ ref?: React.Ref<unknown>; onMouseEnter?: () => void; onMouseLeave?: () => void }>;
                    return (
                      <el.type
                        {...el.props}
                        ref={(r: HTMLElement | null) => {
                          anchorRef.current = r;
                          const ref = (el.props as { ref?: React.Ref<unknown> }).ref;
                          if (typeof ref === "function") ref(r);
                          else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = r;
                        }}
                        onMouseEnter={show}
                        onMouseLeave={hide}
                      />
                    );
                  })()
                )
              : child
          )
        : child}
      {visible &&
        createPortal(
          <div
            className={cn("ds-tooltip", className)}
            style={{
              position: "fixed",
              left: coords.x,
              top: coords.y - 4,
              transform: "translate(-50%, -100%)",
              pointerEvents: "none",
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
