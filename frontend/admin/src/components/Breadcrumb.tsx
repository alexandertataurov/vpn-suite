import { Link } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: string;
  /** Render last item as h1 for a11y when no separate title in PageHeader */
  lastAsTitle?: boolean;
}

export function Breadcrumb({ items, separator = " / ", lastAsTitle = false }: BreadcrumbProps) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const CurrentTag = lastAsTitle && isLast ? "h1" : "span";
          return (
            <li key={i} className="breadcrumb-item">
              {i > 0 ? <span className="breadcrumb-sep" aria-hidden>{separator}</span> : null}
              {!isLast && item.to != null ? (
                <Link to={item.to} className="breadcrumb-link">
                  {item.label}
                </Link>
              ) : (
                <CurrentTag className={lastAsTitle && isLast ? "breadcrumb-current breadcrumb-title" : "breadcrumb-current"} aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </CurrentTag>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
