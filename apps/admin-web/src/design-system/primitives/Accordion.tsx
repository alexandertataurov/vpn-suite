import type { ReactNode } from "react";
import { createContext, useContext, useId, useState } from "react";

interface AccordionProps {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  children: ReactNode;
  className?: string;
}

interface AccordionContextValue {
  openValue: string | null;
  setOpenValue: (value: string | null) => void;
  idBase: string;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext(component: string): AccordionContextValue {
  const ctx = useContext(AccordionContext);
  if (!ctx) {
    throw new Error(`${component} must be used within <Accordion>.`);
  }
  return ctx;
}

export function Accordion({
  value,
  defaultValue = null,
  onValueChange,
  children,
  className = "",
}: AccordionProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue);
  const openValue = (isControlled ? value : internalValue) ?? null;
  const idBase = useId();

  const setOpenValue = (next: string | null) => {
    if (!isControlled) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  };

  const ctx: AccordionContextValue = { openValue, setOpenValue, idBase };

  return (
    <AccordionContext.Provider value={ctx}>
      <div className={["accordion", className || null].filter(Boolean).join(" ")}>{children}</div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps {
  value: string;
  title: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function AccordionItem({
  value,
  title,
  meta,
  children,
  className = "",
  disabled = false,
}: AccordionItemProps) {
  const { openValue, setOpenValue, idBase } = useAccordionContext("AccordionItem");
  const isOpen = openValue === value;
  const headerId = `${idBase}-header-${value}`;
  const panelId = `${idBase}-panel-${value}`;

  const handleToggle = () => {
    if (disabled) return;
    setOpenValue(isOpen ? null : value);
  };

  return (
    <div className={["accordion-item", className || null].filter(Boolean).join(" ")}>
      <button
        type="button"
        id={headerId}
        className={["accordion-trigger", isOpen ? "active" : null].filter(Boolean).join(" ")}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={handleToggle}
        disabled={disabled}
      >
        <span>{title}</span>
        {meta && <span className="accordion-meta">{meta}</span>}
        <svg
          className="accordion-icon"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        className={["accordion-body", isOpen ? "open" : null].filter(Boolean).join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

