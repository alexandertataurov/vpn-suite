import { useState, useRef, useEffect, useCallback, useLayoutEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Z_DROPDOWN, Z_OVERLAY } from "../../theme/z-index";
import { cn } from "../../utils/cn";

export interface DropdownMenuItem {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  align?: "start" | "end";
  /** Render menu in portal (document.body) to avoid clipping by overflow containers (e.g. table-wrap) */
  portal?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function DropdownMenu({
  trigger,
  items,
  align = "end",
  portal = false,
  className,
  "data-testid": dataTestId,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useLayoutEffect(() => {
    if (!open || !portal || !containerRef.current) {
      setPosition(null);
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 4,
      ...(align === "end"
        ? { right: window.innerWidth - rect.right }
        : { left: rect.left }),
    });
  }, [open, portal, align]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, close]);

  useEffect(() => {
    if (open && listRef.current) {
      const first = listRef.current.querySelector<HTMLButtonElement>('[role="menuitem"]:not([disabled])');
      first?.focus();
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [];
    if (e.key === "ArrowDown" && index < buttons.length - 1) {
      e.preventDefault();
      buttons[index + 1]?.focus();
    } else if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      buttons[index - 1]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  const positionStyle: React.CSSProperties | undefined = portal && position
    ? {
        position: "fixed",
        top: position.top,
        left: position.left,
        right: position.right,
        zIndex: Z_OVERLAY,
      }
    : {
        position: "absolute",
        top: "100%",
        [align]: 0,
        marginTop: "var(--space-xs)",
        zIndex: Z_DROPDOWN,
      };

  const menuEl = open ? (
    <div
      ref={listRef}
      role="menu"
      className="dropdown-menu-list"
      style={positionStyle}
    >
      {items.map((item, index) => ( // key=
        <button key={item.id} type="button"
          role="menuitem"
          disabled={item.disabled}
          className={cn("dropdown-menu-item", "btn", "btn-ghost", "btn-sm")}
          data-danger={item.danger ? "true" : undefined}
          onClick={() => {
            if (!item.disabled) {
              item.onClick();
              close();
            }
          }}
          onKeyDown={(e) => handleKeyDown(e, index)}
        >
          {item.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      className={cn("dropdown-menu", className)}
      data-testid={dataTestId}
    >
      <div
        onClick={() => setOpen((o) => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        {trigger}
      </div>
      {portal && menuEl ? createPortal(menuEl, document.body) : menuEl}
    </div>
  );
}
