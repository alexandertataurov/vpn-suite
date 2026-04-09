import type { HTMLAttributes, ElementType, ReactNode } from "react";

type HtmlTag = "div" | "span" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  as?: HtmlTag;
}

function cx(baseClass: string, className?: string) {
  return [baseClass, className || null].filter(Boolean).join(" ");
}

function createTypographyComponent(defaultTag: HtmlTag, typeClass: string) {
  return function TypographyComponent({ as, className, ...props }: TypographyProps) {
    const Tag = (as ?? defaultTag) as ElementType;
    return <Tag className={cx(typeClass, className)} {...props} />;
  };
}

export const PageTitle = createTypographyComponent("h1", "type-h1");

export const SectionTitle = createTypographyComponent("h2", "type-h2");

export const CardTitle = createTypographyComponent("div", "type-h4");

export const BodyText = createTypographyComponent("p", "type-body");

export const BodySmall = createTypographyComponent("p", "type-body-sm");

export const Caption = createTypographyComponent("p", "type-body-xs");

export const NavLabel = createTypographyComponent("span", "type-nav");

export const NavBadge = createTypographyComponent("span", "type-badge");

export const MetaText = createTypographyComponent("span", "type-meta");

interface KpiValueProps extends TypographyProps {
  size?: "xl" | "lg" | "md";
}

export function KpiValue({ size = "lg", as, className, ...props }: KpiValueProps) {
  const Tag = (as ?? "span") as ElementType;
  const typeClass =
    size === "xl" ? "type-data-xl" : size === "md" ? "type-data-md" : "type-data-lg";
  return <Tag className={cx(typeClass, className)} {...props} />;
}

interface KpiDeltaProps extends TypographyProps {
  direction?: "up" | "down" | "flat";
}

export function KpiDelta({ direction, as, className, ...props }: KpiDeltaProps) {
  const Tag = (as ?? "span") as ElementType;
  const directionClass = direction ? `type-delta ${direction}` : "type-delta";
  return <Tag className={cx(directionClass, className)} {...props} />;
}

interface KpiValueUnitProps extends TypographyProps {
  value: ReactNode;
  unit: ReactNode;
}

export function KpiValueUnit({ value, unit, as, className, ...props }: KpiValueUnitProps) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag className={cx("kv", className)} {...props}>
      {value}
      <span className="u">{unit}</span>
    </Tag>
  );
}

