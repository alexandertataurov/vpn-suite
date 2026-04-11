export type StoryDocsStatus = "stable" | "beta" | "deprecated" | "new";

export interface ComponentHeroProps {
  name: string;
  description: string;
  status?: StoryDocsStatus;
  version?: string;
  category?: string;
}

const STORY_STATUS_CLASS_BY_VALUE: Record<StoryDocsStatus, string> = {
  stable: "docs-hero-badge docs-hero-badge--stable",
  beta: "docs-hero-badge docs-hero-badge--beta",
  deprecated: "docs-hero-badge docs-hero-badge--deprecated",
  new: "docs-hero-badge docs-hero-badge--new",
};

function getStoryStatusLabel(status: StoryDocsStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatVersionLabel(version: string) {
  return version.startsWith("v") ? version : `v${version}`;
}

export function ComponentHero({
  name,
  description,
  status = "stable",
  version,
  category,
}: ComponentHeroProps) {
  return (
    <header className="docs-hero">
      <div className="docs-hero__title-row">
        <h1 className="docs-hero__title">{name}</h1>
        <span className={STORY_STATUS_CLASS_BY_VALUE[status]}>{getStoryStatusLabel(status)}</span>
      </div>

      <p className="docs-hero__description">{description}</p>

      {(version != null || category != null) && (
        <div className="docs-hero__pills">
          {version != null ? <span className="docs-hero__pill">{formatVersionLabel(version)}</span> : null}
          {category != null ? <span className="docs-hero__pill">{category}</span> : null}
        </div>
      )}

      <hr className="docs-hero__divider" />
    </header>
  );
}
