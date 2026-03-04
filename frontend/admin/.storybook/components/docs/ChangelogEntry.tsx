import { PrimitiveBadge } from "../../../src/design-system";

export type ChangelogType = "breaking" | "added" | "fixed" | "deprecated";

export interface ChangelogEntryProps {
  version: string;
  date: string;
  changes: { type: ChangelogType; description: string }[];
}

const typeVariant: Record<ChangelogType, "critical" | "nominal" | "warning" | "standby"> = {
  breaking: "critical",
  added: "nominal",
  fixed: "warning",
  deprecated: "standby",
};

export function ChangelogEntry({ version, date, changes }: ChangelogEntryProps) {
  return (
    <div className="mb-6 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <code className="font-mono text-sm font-medium text-[var(--color-text-accent)]">
          v{version}
        </code>
        <span className="text-xs text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-body)" }}>
          {date}
        </span>
      </div>
      <ul className="list-none space-y-2 pl-0">
        {changes.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
            <PrimitiveBadge variant={typeVariant[c.type]} size="sm">
              {c.type}
            </PrimitiveBadge>
            <span>{c.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
