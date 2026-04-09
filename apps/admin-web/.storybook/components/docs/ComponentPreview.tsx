import type { ReactNode } from "react";
import { useState } from "react";
import { Button, Toggle } from "../../design-system-compat";

export interface ComponentPreviewProps {
  children: ReactNode;
  caption?: string;
  playgroundStoryId?: string;
  showThemeToggle?: boolean;
}

export function ComponentPreview({
  children,
  caption,
  playgroundStoryId,
  showThemeToggle = false,
}: ComponentPreviewProps) {
  const [dark, setDark] = useState(true);

  return (
    <div className="my-4">
      <div
        className="relative rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 min-h-[120px]"
        style={{
          backgroundImage: dark
            ? "radial-gradient(circle at 1px 1px, var(--color-border-faint) 1px, transparent 0)"
            : undefined,
          backgroundSize: "8px 8px",
        }}
      >
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {showThemeToggle && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">Light</span>
              <Toggle
                checked={dark}
                onCheckedChange={(v) => setDark(v === true)}
                aria-label="Toggle dark mode"
              />
              <span className="text-xs text-[var(--color-text-muted)]">Dark</span>
            </div>
          )}
          {playgroundStoryId != null && (
            <Button variant="ghost" size="sm" asChild>
              <a href={`/?path=/story/${playgroundStoryId}`}>Open in Playground</a>
            </Button>
          )}
        </div>
        <div>{children}</div>
      </div>
      {caption != null && (
        <p className="mt-2 text-xs text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-body)" }}>
          {caption}
        </p>
      )}
    </div>
  );
}
