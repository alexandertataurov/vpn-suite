import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: ReactNode;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

const SIZE_PX: Record<"sm" | "md" | "lg", number> = { sm: 24, md: 32, lg: 48 };

export function Avatar({ name = "", src, size = "md", className, children }: AvatarProps) {
  const px = SIZE_PX[size];
  const init = initials(name);
  if (children) {
    return (
      <div
        className={cn("ds-avatar", `ds-avatar--${size}`, className)}
        style={{ width: px, height: px, minWidth: px, minHeight: px }}
        aria-hidden
      >
        {children}
      </div>
    );
  }
  if (src) {
    return (
      <img
        src={src}
        alt={name ? `Avatar for ${name}` : ""}
        className={cn("ds-avatar", `ds-avatar--${size}`, className)}
        style={{ width: px, height: px, minWidth: px, minHeight: px }}
      />
    );
  }
  return (
    <div
      className={cn("ds-avatar", "ds-avatar--initials", `ds-avatar--${size}`, className)}
      style={{ width: px, height: px, minWidth: px, minHeight: px }}
      aria-hidden
    >
      {init}
    </div>
  );
}

Avatar.displayName = "Avatar";
