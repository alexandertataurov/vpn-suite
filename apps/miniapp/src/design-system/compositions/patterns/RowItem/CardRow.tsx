import { useLayoutEffect, useRef, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";

export interface CardRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode;
  /** Override theme when used outside a themed ancestor. */
  "data-theme"?: "light" | "dark";
}

function resolveComponentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "consumer-light" ? "light" : "dark";
}

function hasThemedAncestor(el: HTMLElement | null): boolean {
  let node: HTMLElement | null = el?.parentElement ?? null;
  while (node) {
    if (node.hasAttribute("data-theme")) return true;
    node = node.parentElement;
  }
  return false;
}

/** Card container for RowItems. Sets data-theme only when no themed ancestor (avoids overriding ThemePane). */
export function CardRow({ children, className = "", "data-theme": dataTheme, ...props }: CardRowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [needsTheme, setNeedsTheme] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">(dataTheme ?? "dark");

  useLayoutEffect(() => {
    if (dataTheme != null) return;
    const el = ref.current;
    if (hasThemedAncestor(el)) {
      setNeedsTheme(false);
      return;
    }
    setTheme(resolveComponentTheme());
  }, [dataTheme]);

  const dataThemeAttr = dataTheme != null ? dataTheme : needsTheme ? theme : undefined;
  return (
    <div
      ref={ref}
      className={`card-row ${className}`.trim()}
      data-theme={dataThemeAttr}
      {...props}
    >
      {children}
    </div>
  );
}
