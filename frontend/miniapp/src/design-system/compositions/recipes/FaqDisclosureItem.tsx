import { useId } from "react";
import { Button } from "../../components/Button";

export interface FaqDisclosureItemProps {
  title: string;
  body: string;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function FaqDisclosureItem({
  title,
  body,
  isOpen,
  onToggle,
  className = "",
}: FaqDisclosureItemProps) {
  const panelId = useId();
  const triggerId = `${panelId}-trigger`;

  return (
    <li className={["support-faq-item", className].filter(Boolean).join(" ")}>
      <Button
        id={triggerId}
        type="button"
        variant="ghost"
        fullWidth
        className="support-faq-trigger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="op-name type-h3">{title}</span>
        <span className="support-faq-symbol" aria-hidden>
          {isOpen ? "−" : "+"}
        </span>
      </Button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        className="support-faq-panel"
        data-state={isOpen ? "open" : "closed"}
        aria-hidden={!isOpen}
      >
        <div className="support-faq-panel__inner">
          <p className="op-desc type-body-sm">{body}</p>
        </div>
      </div>
    </li>
  );
}
