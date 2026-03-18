import type { ReactNode } from "react";
import { IconChevronLeft } from "../../icons";
import "./PageHeader.css";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** When undefined, back button is hidden (e.g. onboarding step 0). */
  onBack?: () => void;
  /** Right-aligned slot (e.g. settings gear) */
  action?: ReactNode;
  /** Aria-label for back button. Default "Back". Use t("common.back_aria") for i18n. */
  backAriaLabel?: string;
}

/**
 * Canonical page header for secondary pages (Settings, Plan, Devices, Checkout, Support, Restore Access, Onboarding).
 * Layout: optional back button + title block + optional action. Left-aligned.
 */
export function PageHeader({ title, subtitle, onBack, action, backAriaLabel = "Back" }: PageHeaderProps) {
  return (
    <header className="page-header" data-layer="PageHeader">
      {onBack ? (
        <button
          type="button"
          className="page-header-back"
          onClick={onBack}
          aria-label={backAriaLabel}
        >
          <IconChevronLeft size={14} strokeWidth={2.5} />
        </button>
      ) : null}
      <div className="page-header-text">
        <h1 className="page-header-title">{title}</h1>
        {subtitle ? <p className="page-header-subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="page-header-action">{action}</div> : null}
    </header>
  );
}
