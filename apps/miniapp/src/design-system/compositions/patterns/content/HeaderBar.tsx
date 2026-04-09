import type { ReactNode } from "react";
import { IconChevronLeft } from "@/design-system/icons";
import "./HeaderBar.css";

export interface HeaderBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: ReactNode;
  backAriaLabel?: string;
  className?: string;
  /** For analytics. */
  "data-layer"?: string;
}

/**
 * Page header pattern: back button + title block + optional action.
 * Extracted from PageHeader.
 */
export function HeaderBar({
  title,
  subtitle,
  onBack,
  action,
  backAriaLabel = "Back",
  className,
  "data-layer": dataLayer,
}: HeaderBarProps) {
  return (
    <header
      className={["header-bar", className].filter(Boolean).join(" ")}
      {...(dataLayer ? { "data-layer": dataLayer } : {})}
    >
      {onBack ? (
        <button
          type="button"
          className="header-bar__back"
          onClick={onBack}
          aria-label={backAriaLabel}
        >
          <IconChevronLeft size={14} strokeWidth={2.5} />
        </button>
      ) : null}
      <div className="header-bar__text">
        <h1 className="header-bar__title">{title}</h1>
        {subtitle ? <p className="header-bar__subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="header-bar__action">{action}</div> : null}
    </header>
  );
}
