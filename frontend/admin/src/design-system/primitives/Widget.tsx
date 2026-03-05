import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Card } from "./Card";
import { CardTitle, Caption } from "../typography";

/** Left-edge accent per design-system: category of data (sessions=blue, health=green, incidents=amber, errors=red, latency=violet, cluster=teal) */
export type WidgetEdgeAccent = "blue" | "green" | "amber" | "red" | "violet" | "teal";

const EDGE_CLASS: Record<WidgetEdgeAccent, string> = {
  blue: "eb",
  green: "eg",
  amber: "ea",
  red: "er",
  violet: "ev",
  teal: "et",
};

interface WidgetProps {
  title: ReactNode;
  subtitle?: ReactNode;
  variant?: "default" | "kpi";
  /** Left-edge accent for KPI cards (design-system Section 4). Only applied when variant="kpi". */
  edge?: WidgetEdgeAccent;
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
  edge,
  className,
  headerRight,
  href,
  onClick,
  interactive = false,
  children,
}: WidgetProps) {
  const isInteractive = interactive || !!href || !!onClick;
  const edgeClass = variant === "kpi" && edge ? EDGE_CLASS[edge] : null;
  const rootClassName = cx(
    "widget",
    variant === "kpi" && "kpi",
    variant === "kpi" && edge && "edge",
    edgeClass,
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

  return (
    <Card variant={isInteractive ? "interactive" : "default"} className={rootClassName}>
      {inner}
    </Card>
  );
}

