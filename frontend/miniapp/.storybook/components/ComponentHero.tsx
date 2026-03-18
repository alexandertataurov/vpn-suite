import type { ReactNode } from "react";

export type HeroStatus = "stable" | "beta" | "deprecated" | "new";

const statusClass: Record<HeroStatus, string> = {
  stable: "docs-hero-badge docs-hero-badge--stable",
  beta: "docs-hero-badge docs-hero-badge--beta",
  deprecated: "docs-hero-badge docs-hero-badge--deprecated",
  new: "docs-hero-badge docs-hero-badge--new",
};

export interface ComponentHeroProps {
  name: string;
  description: string;
  status?: HeroStatus;
  version?: string;
  category?: string;
  children?: ReactNode;
}

export function ComponentHero({
  name,
  description,
  status = "stable",
  version,
  category,
}: ComponentHeroProps) {
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <header className="docs-hero">
      <div className="docs-hero__title-row">
        <h1 className="docs-hero__title">{name}</h1>
        <span className={statusClass[status]}>{statusLabel}</span>
      </div>
      <p className="docs-hero__description">{description}</p>
      {(version != null || category != null) && (
        <div className="docs-hero__pills">
          {version != null && <span className="docs-hero__pill">v{version}</span>}
          {category != null && <span className="docs-hero__pill">{category}</span>}
        </div>
      )}
      <hr className="docs-hero__divider" />
    </header>
  );
}
