import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Popover } from "../../components/feedback/Popover";
import { Button } from "../../components/buttons/Button";
import { IconMoreVertical } from "../../icons";

export interface OverflowActionMenuItem {
  id: string;
  label: string;
  hint?: string;
  icon?: ReactNode;
  to?: string;
  state?: unknown;
  onSelect?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export interface OverflowActionMenuProps {
  items: OverflowActionMenuItem[];
  ariaLabel?: string;
  className?: string;
}

export function OverflowActionMenu({
  items,
  ariaLabel = "More actions",
  className = "",
}: OverflowActionMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  const handleSelect = (item: OverflowActionMenuItem) => {
    if (item.disabled) return;
    if (item.onSelect) {
      item.onSelect();
    } else if (item.to) {
      navigate(item.to, item.state !== undefined ? { state: item.state } : undefined);
    }
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      panelClassName="miniapp-popover-panel--menu"
      panelAriaLabel={ariaLabel}
      renderTrigger={(triggerProps) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={["miniapp-overflow-trigger", className].filter(Boolean).join(" ")}
          aria-label={ariaLabel}
          onClick={() => setOpen((prev) => !prev)}
          {...triggerProps}
        >
          <IconMoreVertical size={18} strokeWidth={2} />
        </Button>
      )}
    >
      <ul className="miniapp-menu-list" role="menu" aria-label={ariaLabel}>
        {items.map((item) => (
          <li key={item.id} role="none">
            <Button
              type="button"
              role="menuitem"
              variant="ghost"
              size="sm"
            className={`miniapp-menu-item${item.danger ? " miniapp-menu-item--danger" : ""}`}
            onClick={() => handleSelect(item)}
            disabled={item.disabled}
            >
              {item.icon ? <span className="miniapp-menu-item-icon" aria-hidden>{item.icon}</span> : null}
              <span className="miniapp-menu-item-text">
                <span className="miniapp-menu-item-title">{item.label}</span>
                {item.hint ? <span className="miniapp-menu-item-hint">{item.hint}</span> : null}
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </Popover>
  );
}
