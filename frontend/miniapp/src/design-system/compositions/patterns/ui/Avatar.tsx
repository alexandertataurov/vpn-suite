import type { HTMLAttributes } from "react";

export interface AvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  initials: string;
  size?: "sm" | "md";
  /** Optional image URL; when set, shows image instead of initials */
  src?: string | null;
}

/** Profile avatar with gradient background and initials, or image. */
export function Avatar({ initials, size = "md", src, className = "", ...props }: AvatarProps) {
  const sizeClass = size === "sm" ? "avatar--sm" : "avatar--md";
  return (
    <div
      className={`avatar ${sizeClass} ${className}`.trim()}
      aria-hidden
      {...props}
    >
      {src ? <img src={src} alt="" /> : initials}
    </div>
  );
}
