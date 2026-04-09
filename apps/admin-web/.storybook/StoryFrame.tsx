import type { ReactNode } from "react";

type StoryFrameProps = {
  children: ReactNode;
  /** Checkerboard or subtle grid background */
  background?: "plain" | "checker" | "grid";
};

const bgStyles = {
  plain: "bg-[var(--color-app-preview)]",
  checker:
    "bg-[length:16px_16px] bg-[image:linear-gradient(45deg,#27272A_25%,transparent_25%),linear-gradient(-45deg,#27272A_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#27272A_75%),linear-gradient(-45deg,transparent_75%,#27272A_75%)] bg-[position:0_0,0_8px,8px_-8px,-8px_0] bg-[color:#18181B]",
  grid:
    "bg-[length:24px_24px] bg-[image:linear-gradient(#27272A_1px,transparent_1px),linear-gradient(90deg,#27272A_1px,transparent_1px)] bg-[color:#0F0F0F]",
};

export function StoryFrame({ children, background = "plain" }: StoryFrameProps) {
  return (
    <div
      className={`min-h-[120px] rounded-lg p-6 ${bgStyles[background]}`}
      style={{ transition: "background 150ms ease" }}
    >
      {children}
    </div>
  );
}
