import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Card } from "./Card";
import { CardTitle, Caption } from "../typography";

interface WidgetProps {
  title: ReactNode;
  subtitle?: ReactNode;
  variant?: "default" | "kpi";
  className?: string;
  headerRight?: ReactNode;
  /** Link target for drill-down; adds "View" link in header when set */
  href?: string;
  /** Click handler; enables interactive styling when set */
  onClick?: () => void;
  /** Apply interactive hover/focus styles */
  interactive?: boolean;
  children?: ReactNode;
}

function cx(...classes: Array<string | null | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Widget({
  title,
  subtitle,
  variant = "default",
  className,
  headerRight,
  href,
  onClick,
  interactive = false,
  children,
}: WidgetProps) {
  const isInteractive = interactive || !!href || !!onClick;
  const rootClassName = cx(
    "widget",
    variant === "kpi" && "kpi",
    isInteractive && "widget--interactive",
    className
  );

  const viewLink = href ? (
    <Link
      to={href}
      className={variant === "kpi" ? "widget__action kpi-link" : "widget__action"}
      aria-label={`View ${String(title)}`}
    >
      View <ChevronRight size={14} aria-hidden />
    </Link>
  ) : null;
  const headerAction =
    headerRight || viewLink ? (
      <span className="widget__header-right">
        {headerRight}
        {viewLink}
      </span>
    ) : null;

  const inner = (
    <>
      <div className={cx("widget__header", variant === "kpi" && "kpi-top")}>
        <div>
          <CardTitle
            as="h3"
            className={cx("widget__title", variant === "kpi" && "kpi-label")}
          >
            {title}
          </CardTitle>
          {subtitle && (
            <Caption
              className={cx("widget__subtitle", variant === "kpi" && "kpi-sub")}
            >
              {subtitle}
            </Caption>
          )}
        </div>
        {headerAction}
      </div>
      {children}
    </>
  );

  if (href && !onClick) {
    return (
      <Link to={href} className={`card ${rootClassName}`.trim()}>
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div
        className={`card ${rootClassName}`.trim()}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        role="button"
        tabIndex={0}
      >
        {inner}
      </div>
    );
  }

  return <Card className={rootClassName}>{inner}</Card>;
}

