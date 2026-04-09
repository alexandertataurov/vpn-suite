import type { ReactNode } from "react";

export interface LayoutDocLayoutProps {
  title: string;
  subtitle: string;
  description: string;
  children: ReactNode;
}

export function LayoutDocLayout({ title, subtitle, description, children }: LayoutDocLayoutProps) {
  return (
    <div className="layout-doc">
      <main className="layout-doc__main">
        <header className="layout-doc__header">
          <h1 className="layout-doc__title">{title}</h1>
          <p className="layout-doc__subtitle">{subtitle}</p>
          <p className="layout-doc__description">{description}</p>
        </header>
        {children}
      </main>
    </div>
  );
}

export interface LayoutSectionProps {
  id: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
}

export function LayoutSection({ id, title, description, children }: LayoutSectionProps) {
  return (
    <section className="layout-doc-section" id={id}>
      <h2 className="layout-doc-section__heading">
        <a href={`#${id}`}>
          {title}
          <span className="layout-doc-section__anchor" aria-hidden>#</span>
        </a>
      </h2>
      <hr className="layout-doc-section__rule" />
      <div className="layout-doc-section__description">{description}</div>
      {children}
    </section>
  );
}

export interface PreviewCanvasProps {
  children: ReactNode;
  label?: string;
}

export function PreviewCanvas({ children, label }: PreviewCanvasProps) {
  return (
    <div className="layout-doc-preview-canvas">
      {children}
      {label != null && <div className="layout-doc-preview-canvas__label">{label}</div>}
    </div>
  );
}

export interface CodeChipProps {
  children: ReactNode;
}

export function CodeChip({ children }: CodeChipProps) {
  return <code className="layout-doc-code-chip">{children}</code>;
}
