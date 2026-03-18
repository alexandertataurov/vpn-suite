import type { ReactNode } from "react";
import "./PageLayout.css";

export interface PageLayoutProps {
  children: ReactNode;
  scrollable?: boolean;
  noPaddingTop?: boolean;
}

export function PageLayout({
  children,
  scrollable = true,
  noPaddingTop = false,
}: PageLayoutProps) {
  const classes = [
    "page-layout",
    scrollable ? "page-layout--scrollable" : "",
    noPaddingTop ? "page-layout--no-padding-top" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
