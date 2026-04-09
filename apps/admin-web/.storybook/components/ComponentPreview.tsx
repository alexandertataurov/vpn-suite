import type { ReactNode } from "react";

type ComponentPreviewProps = {
  children: ReactNode;
};

export function ComponentPreview({ children }: ComponentPreviewProps) {
  return (
    <div className="my-4 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
      {children}
    </div>
  );
}
