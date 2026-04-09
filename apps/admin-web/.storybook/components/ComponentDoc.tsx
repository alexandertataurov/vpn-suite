import type { ReactNode } from "react";

export type ComponentStatus = "stable" | "beta" | "deprecated";

export interface ComponentDocProps {
  name: string;
  status?: ComponentStatus;
  description: string;
  whenToUse: string;
  importPath: string;
  version?: string;
  figma?: string;
  github?: string;
  accessibilityScore?: string | number;
  children?: ReactNode;
}

const statusStyles: Record<ComponentStatus, string> = {
  stable: "bg-[var(--color-nominal-dim)] text-[var(--color-nominal-bright)] border-[var(--color-nominal-border)]",
  beta: "bg-[var(--color-warning-dim)] text-[var(--color-warning-bright)] border-[var(--color-warning-border)]",
  deprecated: "bg-[var(--color-critical-dim)] text-[var(--color-critical-bright)] border-[var(--color-critical-border)]",
};

export function ComponentDoc({
  name,
  status = "stable",
  description,
  whenToUse,
  importPath,
  version,
  figma,
  github,
  accessibilityScore,
  children,
}: ComponentDocProps) {
  return (
    <article className="component-doc">
      <header className="mb-10">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {name}
          </h1>
          <span
            className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium uppercase tracking-wider ${statusStyles[status]}`}
          >
            {status}
          </span>
        </div>
        <p className="mb-3 text-base text-[var(--color-text-secondary)]">{description}</p>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">{whenToUse}</p>
        <div className="mb-4 overflow-x-auto rounded border border-[var(--color-border-subtle)] bg-[var(--color-base)] p-3">
          <code className="font-mono text-xs text-[var(--color-text-accent)]">
            {`import { ${name} } from "${importPath}";`}
          </code>
        </div>
        <div className="flex flex-wrap gap-2">
          {version && (
            <span className="rounded bg-[var(--color-elevated)] px-2 py-1 text-xs text-[var(--color-text-muted)]">
              v{version}
            </span>
          )}
          {figma && (
            <a
              href={figma}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-[var(--color-elevated)] px-2 py-1 text-xs text-[var(--color-text-accent)] hover:underline"
            >
              Figma
            </a>
          )}
          {github && (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-[var(--color-elevated)] px-2 py-1 text-xs text-[var(--color-text-accent)] hover:underline"
            >
              Source
            </a>
          )}
          {accessibilityScore != null && (
            <span className="rounded bg-[var(--color-elevated)] px-2 py-1 text-xs text-[var(--color-text-muted)]">
              a11y: {accessibilityScore}
            </span>
          )}
        </div>
      </header>
      {children}
    </article>
  );
}
