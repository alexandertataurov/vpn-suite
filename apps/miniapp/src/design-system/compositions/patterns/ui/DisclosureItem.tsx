import { useId, useState, type ReactNode } from "react";
import { IconPlus } from "@/design-system/icons";
import "./DisclosureItem.css";

export interface DisclosureItemProps {
  trigger: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

/**
 * Accordion pattern: trigger button + collapsible content.
 * Extracted from FaqDisclosureItem.
 */
export function DisclosureItem({
  trigger,
  children,
  defaultOpen = false,
  isOpen: isOpenProp,
  onToggle,
  className,
}: DisclosureItemProps) {
  const panelId = useId();
  const triggerTextId = useId();
  const isControlled = isOpenProp !== undefined && onToggle !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? isOpenProp! : internalOpen;
  const handleToggle = isControlled ? onToggle! : () => setInternalOpen((v) => !v);

  return (
    <div className={["disclosure-item", className].filter(Boolean).join(" ")} data-open={isOpen}>
      <button
        type="button"
        className="disclosure-item__trigger"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span id={triggerTextId} className="disclosure-item__trigger-text">
          {trigger}
        </span>
        <span className="disclosure-item__icon" aria-hidden="true">
          <IconPlus size={14} strokeWidth={1.75} />
        </span>
      </button>
      <div
        id={panelId}
        className="disclosure-item__content"
        role="region"
        aria-labelledby={triggerTextId}
        hidden={!isOpen}
      >
        <div className="disclosure-item__content-inner">{children}</div>
      </div>
    </div>
  );
}
