import type { ReactNode } from "react";

export function StoryStack({ children }: { children: ReactNode }) {
  return <div className="sb-stack">{children}</div>;
}

export function StoryRow({ children }: { children: ReactNode }) {
  return <div className="sb-row">{children}</div>;
}

export function StoryGrid({ children, columns }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  const columnsAttr = columns ? String(columns) : undefined;
  return (
    <div className="sb-grid" data-columns={columnsAttr}>
      {children}
    </div>
  );
}

export function StoryPanel({ children }: { children: ReactNode }) {
  return <div className="sb-card">{children}</div>;
}

export function StorySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="sb-section">
      <div className="sb-section-title">{title}</div>
      {children}
    </section>
  );
}

export function NarrowFrame({ children }: { children: ReactNode }) {
  return <div className="max-w-200">{children}</div>;
}
