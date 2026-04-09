import type { ReactElement, ReactNode } from "react";
import { Children, cloneElement, isValidElement } from "react";

interface BreadcrumbProps {
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
}

export function Breadcrumb({ children, ariaLabel = "Breadcrumb", className = "" }: BreadcrumbProps) {
  const items: ReactElement[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child)) {
      items.push(child);
    }
  });

  const content: ReactNode[] = [];
  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    content.push(
      cloneElement(item, {
        key: item.key ?? index,
        isCurrentPage: isLast,
      } as Partial<BreadcrumbItemProps>)
    );
    if (!isLast) {
      content.push(
        <span key={`sep-${index}`} className="breadcrumb-sep" aria-hidden="true">
          /
        </span>
      );
    }
  });

  return (
    <nav aria-label={ariaLabel}>
      <div className={["breadcrumb", className || null].filter(Boolean).join(" ")}>{content}</div>
    </nav>
  );
}

interface BreadcrumbItemProps {
  children: ReactNode;
  href?: string;
  isCurrentPage?: boolean;
}

export function BreadcrumbItem({ children, href, isCurrentPage = false }: BreadcrumbItemProps) {
  const content = href && !isCurrentPage ? <a href={href}>{children}</a> : children;
  return (
    <span
      className={["breadcrumb-item", isCurrentPage ? "current" : null]
        .filter(Boolean)
        .join(" ")}
      {...(isCurrentPage ? { "aria-current": "page" } : {})}
    >
      {content}
    </span>
  );
}

