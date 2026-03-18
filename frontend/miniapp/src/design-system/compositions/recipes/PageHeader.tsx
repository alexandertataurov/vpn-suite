import type { ReactNode } from "react";
import { Button } from "../../components/Button";
import { IconChevronLeft } from "../../icons";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  /** Right-aligned slot (e.g. settings icon) */
  action?: ReactNode;
}

/**
 * Page header for secondary pages (Settings, Plan, Restore Access, Support).
 * Layout: back button + title block + optional action. Left-aligned.
 */
export function PageHeader({ title, subtitle, onBack, action }: PageHeaderProps) {
  return (
    <header className="page-header" data-layer="PageHeader">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="page-header-back"
        onClick={onBack}
        aria-label="Back"
      >
        <IconChevronLeft size={14} strokeWidth={2.5} />
      </Button>
      <div className="page-header-title-block">
        <h1 className="page-header-title">{title}</h1>
        {subtitle ? <p className="page-header-subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="page-header-action">{action}</div> : null}
    </header>
  );
}
