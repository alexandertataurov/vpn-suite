import type { ReactNode } from "react";
import { Widget, type WidgetEdgeAccent } from "../../primitives/Widget";
import { KpiValue } from "../../typography";

interface KpiNumberWidgetProps {
  title: string;
  subtitle?: string;
  href?: string;
  /** Left-edge accent (design-system). Omit for neutral. */
  edge?: WidgetEdgeAccent;
  children: ReactNode;
  className?: string;
}

export function KpiNumberWidget({ title, subtitle, href, edge, children, className }: KpiNumberWidgetProps) {
  return (
    <Widget title={title} subtitle={subtitle} variant="kpi" edge={edge} href={href} className={className}>
      <KpiValue as="div" className="kpi__value">
        {children}
      </KpiValue>
    </Widget>
  );
}
