import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@vpn-suite/shared";
import { Heading as PrimitiveHeading } from "../../core/primitives/typography/Heading";
import { Text as PrimitiveText } from "../../core/primitives/typography/Text";

type TextTag = "h1" | "h2" | "h3" | "p" | "span" | "div" | "code";
type CaptionUrgency = "default" | "elevated" | "warning" | "critical";
type TypoTone = "neutral" | "healthy" | "advisory" | "critical" | "muted";
type TruncateMode = "none" | "line1" | "line2";

interface MiniappTextProps extends HTMLAttributes<HTMLElement> {
  as?: TextTag;
  children: ReactNode;
  tabular?: boolean;
  tone?: TypoTone;
  truncate?: TruncateMode;
}

interface CaptionProps extends MiniappTextProps {
  urgency?: CaptionUrgency;
}

/** Display-style title (type-display-sm). Primitives: use Heading + Text for full scale. */
export function Display({
  className,
  tabular = false,
  tone,
  truncate = "none",
  ...props
}: MiniappTextProps) {
  const truncateClass =
    truncate === "line1" ? "typo-line-1-ellipsis" : truncate === "line2" ? "typo-line-2-clamp" : null;
  return (
    <h1
      {...props}
      data-typo-tone={tone}
      className={cn("type-display-sm", tabular && "miniapp-tnum", truncateClass, className)}
    />
  );
}

export function H1(props: MiniappTextProps) {
  const { className, tabular = false, tone, truncate = "none", ...rest } = props;
  const truncateClass =
    truncate === "line1" ? "typo-line-1-ellipsis" : truncate === "line2" ? "typo-line-2-clamp" : null;
  return (
    <PrimitiveHeading
      level={1}
      data-typo-tone={tone}
      className={cn(tabular && "miniapp-tnum", truncateClass, className)}
      {...(rest as React.ComponentProps<typeof PrimitiveHeading>)}
    />
  );
}

export function H2(props: MiniappTextProps) {
  const { className, tabular = false, tone, truncate = "none", ...rest } = props;
  const truncateClass =
    truncate === "line1" ? "typo-line-1-ellipsis" : truncate === "line2" ? "typo-line-2-clamp" : null;
  return (
    <PrimitiveHeading
      level={2}
      data-typo-tone={tone}
      className={cn(tabular && "miniapp-tnum", truncateClass, className)}
      {...(rest as React.ComponentProps<typeof PrimitiveHeading>)}
    />
  );
}

export function H3(props: MiniappTextProps) {
  const { className, tabular = false, tone, truncate = "none", ...rest } = props;
  const truncateClass =
    truncate === "line1" ? "typo-line-1-ellipsis" : truncate === "line2" ? "typo-line-2-clamp" : null;
  return (
    <PrimitiveHeading
      level={3}
      data-typo-tone={tone}
      className={cn(tabular && "miniapp-tnum", truncateClass, className)}
      {...(rest as React.ComponentProps<typeof PrimitiveHeading>)}
    />
  );
}

export function Body({
  className,
  tabular = false,
  as: _as,
  tone,
  truncate = "none",
  ...props
}: MiniappTextProps) {
  void _as;
  return (
    <PrimitiveText
      variant="body"
      as="p"
      data-typo-tone={tone}
      className={cn(
        tabular && "miniapp-tnum",
        truncate === "line1" && "typo-line-1-ellipsis",
        truncate === "line2" && "typo-line-2-clamp",
        className,
      )}
      {...props}
    />
  );
}

/** Caption style (type-caption). Use for small supporting text. */
export function Caption({
  className,
  tabular = false,
  urgency = "default",
  as: _as,
  tone,
  truncate = "none",
  ...props
}: CaptionProps) {
  void _as;
  return (
    <PrimitiveText
      variant="caption"
      as="p"
      className={cn(
        tabular && "miniapp-tnum",
        urgency !== "default" && `type-caption--${urgency}`,
        truncate === "line1" && "typo-line-1-ellipsis",
        truncate === "line2" && "typo-line-2-clamp",
        className,
      )}
      data-typo-tone={tone}
      {...props}
    />
  );
}
