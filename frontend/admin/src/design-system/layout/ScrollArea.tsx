import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface ScrollAreaProps {
  children: ReactNode;
  className?: string;
}

export function ScrollArea(props: ScrollAreaProps) {
  return <div className={cn("ds-scroll-area", props.className)}>{props.children}</div>;
}

ScrollArea.displayName = "ScrollArea";
