import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Heading as PrimitiveHeading } from "../primitives/typography/Heading";
import { Text as PrimitiveText } from "../primitives/typography/Text";

type TextTag = "h1" | "h2" | "h3" | "p" | "span" | "div" | "code";

interface MiniappTextProps extends HTMLAttributes<HTMLElement> {
  as?: TextTag;
  children: ReactNode;
  tabular?: boolean;
}

/** Display-style title (type-display-sm). Primitives: use Heading + Text for full scale. */
export function Display({ className, tabular = false, ...props }: MiniappTextProps) {
  return (
    <h1
      {...props}
      className={cn("type-display-sm", tabular && "miniapp-tnum", className)}
    />
  );
}

export function H1(props: MiniappTextProps) {
  return <PrimitiveHeading level={1} {...(props as React.ComponentProps<typeof PrimitiveHeading>)} />;
}

export function H2(props: MiniappTextProps) {
  return <PrimitiveHeading level={2} {...(props as React.ComponentProps<typeof PrimitiveHeading>)} />;
}

export function H3(props: MiniappTextProps) {
  return <PrimitiveHeading level={3} {...(props as React.ComponentProps<typeof PrimitiveHeading>)} />;
}

export function Body({ className, tabular = false, as: _as, ...props }: MiniappTextProps) {
  void _as;
  return (
    <PrimitiveText
      variant="body"
      as="p"
      className={cn(tabular && "miniapp-tnum", className)}
      {...props}
    />
  );
}

/** Caption style (type-caption). Use for small supporting text. */
export function Caption({ className, tabular = false, as: _as, ...props }: MiniappTextProps) {
  void _as;
  return (
    <PrimitiveText
      variant="caption"
      as="p"
      className={cn(tabular && "miniapp-tnum", className)}
      {...props}
    />
  );
}
