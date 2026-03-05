import type { HTMLAttributes, ReactNode } from "react";

type TextTag = "h1" | "h2" | "h3" | "p" | "span" | "div";

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  as?: TextTag;
  children: ReactNode;
}

function render(typeClass: string, { as = "p", children, className = "", ...props }: TypographyProps) {
  const Component = as;
  return (
    <Component className={`${typeClass} ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}

export function PageTitle(props: TypographyProps) {
  return render("ds-page-title", { as: "h1", ...props });
}

export function SectionTitle(props: TypographyProps) {
  return render("ds-section-title", { as: "h2", ...props });
}

export function CardTitle(props: TypographyProps) {
  return render("ds-card-title", { as: "h3", ...props });
}

export function BodyText(props: TypographyProps) {
  return render("ds-body-text", { as: "p", ...props });
}

export function Caption(props: TypographyProps) {
  return render("ds-caption", { as: "p", ...props });
}

export function Label(props: TypographyProps) {
  return render("ds-label", { as: "span", ...props });
}
