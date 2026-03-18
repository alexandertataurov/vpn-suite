import { IconChevronLeft } from "../../icons";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
}

/**
 * Page header for secondary pages (Settings, Plan, Restore Access, Support).
 * Layout: back button + title block. Left-aligned.
 */
export function PageHeader({ title, subtitle, onBack }: PageHeaderProps) {
  return (
    <header className="page-header" data-layer="PageHeader">
      <button
        type="button"
        className="page-header-back"
        onClick={onBack}
        aria-label="Back"
      >
        <IconChevronLeft size={14} strokeWidth={2.5} />
      </button>
      <div className="page-header-title-block">
        <h1 className="page-header-title">{title}</h1>
        {subtitle ? <p className="page-header-subtitle">{subtitle}</p> : null}
      </div>
    </header>
  );
}
