import type { HTMLAttributes } from "react";

export interface AvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  initials: string;
  size?: "sm" | "md";
}

/** Profile avatar with gradient background and initials. */
export function Avatar({ initials, size = "md", className = "", ...props }: AvatarProps) {
  const sizeClass = size === "sm" ? "avatar--sm" : "avatar--md";
  return (
    <div
      className={`avatar ${sizeClass} ${className}`.trim()}
      aria-hidden
      {...props}
    >
      {initials}
    </div>
  );
}
