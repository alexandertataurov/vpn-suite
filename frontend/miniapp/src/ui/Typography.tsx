import type { HTMLAttributes, ReactNode } from "react";

type TextTag = "h1" | "h2" | "h3" | "p" | "span" | "div" | "code";

interface MiniappTextProps extends HTMLAttributes<HTMLElement> {
  as?: TextTag;
  children: ReactNode;
  tabular?: boolean;
}

function renderText(
  className: string,
  { as = "p", children, tabular = false, ...props }: MiniappTextProps,
) {
  const Component = as;
  const tabularClassName = tabular ? "miniapp-tnum" : "";
  const mergedClassName = `${className} ${tabularClassName} ${props.className ?? ""}`.trim();

  return (
    <Component {...props} className={mergedClassName}>
      {children}
    </Component>
  );
}

export function Display(props: MiniappTextProps) {
  return renderText("miniapp-text-display", { as: "h1", ...props });
}

export function H1(props: MiniappTextProps) {
  return renderText("miniapp-text-h1", { as: "h1", ...props });
}

export function H2(props: MiniappTextProps) {
  return renderText("miniapp-text-h2", { as: "h2", ...props });
}

export function H3(props: MiniappTextProps) {
  return renderText("miniapp-text-h3", { as: "h3", ...props });
}

export function Body(props: MiniappTextProps) {
  return renderText("miniapp-text-body", { as: "p", ...props });
}

export function Caption(props: MiniappTextProps) {
  return renderText("miniapp-text-caption", { as: "p", ...props });
}
