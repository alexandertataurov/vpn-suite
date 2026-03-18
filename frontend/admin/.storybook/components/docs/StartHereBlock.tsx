import type { ReactNode } from "react";

export interface StartHereBlockProps {
  content: string | ReactNode;
}

export function StartHereBlock({ content }: StartHereBlockProps) {
  return (
    <section className="mb-6 rounded border border-[var(--color-accent-border)] bg-[var(--color-accent-dim)] p-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        Start here
      </h2>
      <div className="text-sm text-[var(--color-text-secondary)] [&>p]:m-0 [&>p+p]:mt-2">
        {typeof content === "string" ? <p>{content}</p> : content}
      </div>
    </section>
  );
}
