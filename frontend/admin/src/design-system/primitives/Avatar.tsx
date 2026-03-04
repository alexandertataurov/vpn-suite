import type { ReactNode } from "react";

type AvatarSize = "sm" | "md" | "lg";
type AvatarColor = "blue" | "green" | "orange" | "red" | "purple" | "neutral";
type AvatarStatus = "online" | "away" | "busy" | "offline";

interface AvatarProps {
  /**
   * Full name or label; initials will be derived if `children` is not provided.
   */
  name?: string;
  children?: ReactNode;
  size?: AvatarSize;
  color?: AvatarColor;
  status?: AvatarStatus;
  className?: string;
}

function getInitials(name?: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] ?? "").toUpperCase() + (parts[1]![0] ?? "").toUpperCase();
}

export function Avatar({
  name,
  children,
  size = "md",
  color = "neutral",
  status,
  className = "",
}: AvatarProps) {
  const baseClasses = ["avatar"];
  if (size === "sm") baseClasses.push("avatar-sm");
  if (size === "lg") baseClasses.push("avatar-lg");
  if (color !== "neutral") baseClasses.push(color);

  const content = children ?? getInitials(name);

  return (
    <div className={[...baseClasses, className || null].filter(Boolean).join(" ")}>
      {content}
      {status && <div className={["avatar-status", status].join(" ")} />}
    </div>
  );
}

interface AvatarGroupProps {
  children: ReactNode;
  className?: string;
}

export function AvatarGroup({ children, className = "" }: AvatarGroupProps) {
  return (
    <div className={["avatar-group", className || null].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

