import type { ReactNode } from "react";
import { useState } from "react";
import { Sun, Moon } from "lucide-react";

export interface PreviewProps {
  children: ReactNode;
  background?: "checker" | "grid" | "plain";
  label?: string;
  /** Show light/dark toggle */
  themeToggle?: boolean;
}

const bgMap = {
  plain: "bg-[var(--color-app-preview)]",
  checker:
    "bg-[length:16px_16px] bg-[image:linear-gradient(45deg,#27272A_25%,transparent_25%),linear-gradient(-45deg,#27272A_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#27272A_75%),linear-gradient(-45deg,transparent_75%,#27272A_75%)] bg-[position:0_0,0_8px,8px_-8px,-8px_0] bg-[color:#18181B]",
  grid:
    "bg-[length:24px_24px] bg-[image:linear-gradient(#27272A_1px,transparent_1px),linear-gradient(90deg,#27272A_1px,transparent_1px)] bg-[color:#0F0F0F]",
};

export function Preview({
  children,
  background = "plain",
  label,
  themeToggle = false,
}: PreviewProps) {
  const [dark, setDark] = useState(true);
  const bg = background === "checker" ? bgMap.checker : background === "grid" ? bgMap.grid : bgMap.plain;
  return (
    <div className="my-6 overflow-hidden rounded-lg border border-[var(--color-border-subtle)] shadow-[0_4px_24px_rgba(14,165,233,0.08)]">
      {themeToggle && (
        <div className="flex justify-end gap-1 border-b border-[var(--color-border-subtle)] bg-[var(--color-elevated)] px-2 py-1">
          <button
            type="button"
            onClick={() => setDark(true)}
            className={`rounded p-1.5 transition-colors ${dark ? "bg-[#0EA5E9]/15 text-[#0EA5E9]" : "text-[var(--color-text-muted)] hover:bg-[var(--color-overlay)]"}`}
            title="Dark"
            aria-pressed={dark}
          >
            <Moon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDark(false)}
            className={`rounded p-1.5 transition-colors ${!dark ? "bg-[#0EA5E9]/15 text-[#0EA5E9]" : "text-[var(--color-text-muted)] hover:bg-[var(--color-overlay)]"}`}
            title="Light"
            aria-pressed={!dark}
          >
            <Sun className="h-4 w-4" />
          </button>
        </div>
      )}
      <div
        className={`min-h-[120px] p-6 ${bg} ${!dark && themeToggle ? "bg-[#FAFAFA]" : ""}`}
        data-preview-theme={dark ? "dark" : "light"}
      >
        {children}
      </div>
      {label && (
        <p className="border-t border-[var(--color-border-subtle)] bg-[var(--color-elevated)] px-4 py-2 text-xs text-[var(--color-text-muted)]">
          {label}
        </p>
      )}
    </div>
  );
}
