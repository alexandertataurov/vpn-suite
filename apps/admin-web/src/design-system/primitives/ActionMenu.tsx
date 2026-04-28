import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

export interface ActionMenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

interface ActionMenuProps {
  label?: string;
  items: ActionMenuItem[];
  align?: "start" | "end";
  size?: "sm" | "md";
  trigger?: ReactNode;
}

const sizeClass: Record<NonNullable<ActionMenuProps["size"]>, string> = {
  sm: "btn-sm",
  md: "btn-md",
};

export function ActionMenu({
  label = "More actions",
  items,
  align = "end",
  size = "sm",
  trigger,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const focusItem = (direction: 1 | -1) => {
    const buttons = Array.from(
      rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? []
    );
    if (buttons.length === 0) return;
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex = index === -1 ? 0 : (index + direction + buttons.length) % buttons.length;
    buttons[nextIndex]?.focus();
  };

  return (
    <div className="dropdown action-menu" ref={rootRef}>
      {trigger ? (
        <button
          type="button"
          ref={buttonRef}
          className="action-menu__trigger"
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              requestAnimationFrame(() => focusItem(1));
            }
          }}
        >
          {trigger}
        </button>
      ) : (
        <button
          ref={buttonRef}
          type="button"
          className={["btn", sizeClass[size], "btn-ghost", "action-menu__icon-button"].join(" ")}
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              requestAnimationFrame(() => focusItem(1));
            }
          }}
        >
          <MoreHorizontal size={16} aria-hidden />
        </button>
      )}
      {open ? (
        <div
          id={menuId}
          className={["dropdown-menu", "action-menu__menu", align === "end" ? "action-menu__menu--end" : null, "open"]
            .filter(Boolean)
            .join(" ")}
          role="menu"
          aria-label={label}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={["dropdown-item", item.danger ? "danger" : null].filter(Boolean).join(" ")}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  focusItem(1);
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  focusItem(-1);
                }
              }}
            >
              {item.icon ? <span className="item-icon">{item.icon}</span> : null}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
