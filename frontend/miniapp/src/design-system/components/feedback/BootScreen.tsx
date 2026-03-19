import type { ReactNode } from "react";
import { IconShield } from "@/design-system/icons";
import { cn } from "@vpn-suite/shared";
import "./BootScreen.css";

export type BootIconState = "default" | "error" | "success";

export interface BootScreenProps {
  iconState?: BootIconState;
  children: ReactNode;
  showProgress?: boolean;
  theme?: "dark" | "light";
  className?: string;
}

export function BootScreen({
  iconState = "default",
  children,
  showProgress = false,
  theme,
  className,
}: BootScreenProps) {
  const themeAttr = theme ?? undefined;

  return (
    <div
      className={cn("boot-screen", className)}
      data-theme={themeAttr}
      role="status"
      aria-live="polite"
    >
      {showProgress && <div className="boot-progress-bar" aria-hidden />}
      <div className="boot-center">
        <div className="boot-icon-wrap">
          <IconShield
            size={52}
            strokeWidth={1.5}
            className={cn("boot-icon", `boot-icon--${iconState}`)}
            aria-hidden
          />
        </div>
        <div className="boot-content">{children}</div>
      </div>
    </div>
  );
}
