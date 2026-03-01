import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface KbdProps {
  children: ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return <kbd className={cn("ds-kbd", className)}>{children}</kbd>;
}

Kbd.displayName = "Kbd";
