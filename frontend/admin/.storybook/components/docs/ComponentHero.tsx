import type { ReactNode } from "react";
import { Heading, PrimitiveBadge, PrimitiveDivider } from "../../design-system-compat";

export type HeroStatus = "stable" | "beta" | "deprecated" | "new";

const statusBadgeVariant: Record<HeroStatus, "nominal" | "warning" | "critical" | "accent"> = {
  stable: "nominal",
  beta: "warning",
  deprecated: "critical",
  new: "accent",
};

export interface ComponentHeroProps {
  name: string;
  description: string;
  status?: HeroStatus;
  version?: string;
  category?: string;
  figma?: string;
  github?: string;
  since?: string;
  importPath?: string;
  children?: ReactNode;
}

function Pill({
  children,
  href,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  className?: string;
}) {
  const base =
    "inline-flex items-center rounded border px-2 py-1 text-xs font-medium border-[var(--color-border-subtle)] bg-[var(--color-elevated)] text-[var(--color-text-secondary)]";
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} text-[var(--color-text-accent)] hover:bg-[var(--color-overlay)] transition-colors ${className}`}
      >
        {children}
      </a>
    );
  }
  return <span className={`${base} ${className}`}>{children}</span>;
}

export function ComponentHero({
  name,
  description,
  status = "stable",
  version,
  category,
  figma,
  github,
  since,
  importPath,
}: ComponentHeroProps) {
  const badgeVariant = statusBadgeVariant[status];
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <header className="mb-8">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Heading level={1} className="typo-heading-1">
          {name}
        </Heading>
        <PrimitiveBadge variant={badgeVariant} size="sm">
          {statusLabel}
        </PrimitiveBadge>
      </div>
      <p
        className="mb-4 text-[length:var(--text-lg)] leading-[var(--leading-relaxed)] text-[var(--color-text-muted)]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {description}
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {version != null && (
          <Pill>v{version}</Pill>
        )}
        {category != null && <Pill>{category}</Pill>}
        {figma != null && <Pill href={figma}>Figma</Pill>}
        {github != null && <Pill href={github}>GitHub</Pill>}
        {since != null && <Pill>Since {since}</Pill>}
        {importPath != null && (
          <Pill className="font-mono text-[var(--color-text-accent)]">
            {importPath}
          </Pill>
        )}
      </div>
      <PrimitiveDivider />
    </header>
  );
}
