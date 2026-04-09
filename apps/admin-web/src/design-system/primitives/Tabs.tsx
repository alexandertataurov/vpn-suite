import type { KeyboardEvent, ReactNode } from "react";
import { createContext, useContext, useId, useState } from "react";

type TabsVariant = "underline" | "pill" | "bordered";

interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  children: ReactNode;
  className?: string;
}

interface TabsContextValue {
  activeValue?: string;
  setActiveValue: (value: string) => void;
  idBase: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error(`${component} must be used within <Tabs>.`);
  }
  return ctx;
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  variant = "underline",
  children,
  className = "",
}: TabsProps) {
  const idBase = useId();
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);

  const activeValue = isControlled ? value : internalValue;

  const setActiveValue = (next: string) => {
    if (!isControlled) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  };

  const ctx: TabsContextValue = { activeValue, setActiveValue, idBase };

  const variantClass =
    variant === "pill" ? "tabs-pill" : variant === "bordered" ? "tabs-bordered" : "tabs-underline";

  return (
    <TabsContext.Provider value={ctx}>
      <div className={["tabs", variantClass, className || null].filter(Boolean).join(" ")}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className = "" }: TabsListProps) {
  return (
    <div className={["tab-list", className || null].filter(Boolean).join(" ")} role="tablist">
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className = "" }: TabsTriggerProps) {
  const { activeValue, setActiveValue, idBase } = useTabsContext("TabsTrigger");
  const isActive = activeValue === value;
  const tabId = `${idBase}-tab-${value}`;
  const panelId = `${idBase}-panel-${value}`;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      setActiveValue(value);
      return;
    }

    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

    const list = event.currentTarget.closest('[role="tablist"]');
    if (!list) return;
    const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const idx = tabs.indexOf(event.currentTarget);
    if (idx === -1) return;

    const dir = event.key === "ArrowRight" ? 1 : -1;
    const nextIdx = (idx + dir + tabs.length) % tabs.length;
    const next = tabs[nextIdx];
    if (next) {
      next.focus();
      next.click();
    }
  };

  return (
    <button
      id={tabId}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={panelId}
      tabIndex={isActive ? 0 : -1}
      className={["tab-btn", isActive ? "active" : null, className || null]
        .filter(Boolean)
        .join(" ")}
      onClick={() => setActiveValue(value)}
      onKeyDown={handleKeyDown}
    >
      {children}
    </button>
  );
}

interface TabsPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsPanel({ value, children, className = "" }: TabsPanelProps) {
  const { activeValue, idBase } = useTabsContext("TabsPanel");
  const isActive = activeValue === value;
  const tabId = `${idBase}-tab-${value}`;
  const panelId = `${idBase}-panel-${value}`;

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      hidden={!isActive}
      className={["tab-panel", isActive ? "active" : null, className || null]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

interface TabsItemsProps {
  /**
   * Convenience helper to render tabs from an array.
   */
  items: {
    value: string;
    label: ReactNode;
    panel: ReactNode;
  }[];
  listClassName?: string;
  panelWrapperClassName?: string;
}

export function TabsItems({ items, listClassName, panelWrapperClassName }: TabsItemsProps) {
  return (
    <>
      <TabsList className={listClassName}>
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className={panelWrapperClassName}>
        {items.map((item) => (
          <TabsPanel key={item.value} value={item.value}>
            {item.panel}
          </TabsPanel>
        ))}
      </div>
    </>
  );
}

