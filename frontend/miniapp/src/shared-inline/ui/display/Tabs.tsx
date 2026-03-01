import { useCallback, useRef } from "react";
import { cn } from "../../utils/cn";

export interface TabsItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabsItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  className?: string;
  /** Optional class for each tab button (e.g. telemetry-tab for page tabs) */
  tabClassName?: string;
  /** Prefix for tab/panel ids (default: server). e.g. "billing" -> billing-tab-subscriptions */
  idPrefix?: string;
  /** sm: min-height 32px, compact padding */
  size?: "sm" | "md";
  "data-testid"?: string;
}

export function Tabs({
  items,
  value,
  onChange,
  ariaLabel,
  className,
  tabClassName,
  idPrefix = "server",
  size,
  "data-testid": dataTestId,
}: TabsProps) {
  const tabRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentId: string) => {
      const idx = items.findIndex((i) => i.id === currentId);
      if (idx < 0) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = items[idx + 1];
        if (next && !next.disabled) {
          onChange(next.id);
          tabRefs.current.get(next.id)?.focus();
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = items[idx - 1];
        if (prev && !prev.disabled) {
          onChange(prev.id);
          tabRefs.current.get(prev.id)?.focus();
        }
      } else if (e.key === "Home") {
        e.preventDefault();
        const first = items.find((i) => !i.disabled);
        if (first) {
          onChange(first.id);
          tabRefs.current.get(first.id)?.focus();
        }
      } else if (e.key === "End") {
        e.preventDefault();
        const last = [...items].reverse().find((i) => !i.disabled);
        if (last) {
          onChange(last.id);
          tabRefs.current.get(last.id)?.focus();
        }
      }
    },
    [items, onChange]
  );

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("tabs", size === "sm" && "tabs--sm", className)}
      data-testid={dataTestId}
    >
      {items.map((item) => (
        <button
          key={item.id}
          ref={(el) => {
            tabRefs.current.set(item.id, el);
          }}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${item.id}`}
          aria-selected={value === item.id}
          aria-controls={`${idPrefix}-tabpanel-${item.id}`}
          aria-disabled={item.disabled}
          tabIndex={value === item.id ? 0 : -1}
          disabled={item.disabled}
          className={cn(tabClassName ?? "tabs-page-item", value === item.id && "active")}
          onClick={() => !item.disabled && onChange(item.id)}
          onKeyDown={(e) => handleKeyDown(e, item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
