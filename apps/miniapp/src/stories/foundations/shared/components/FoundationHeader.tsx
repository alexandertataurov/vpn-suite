import "./foundationHeader.css";
import type { ReactNode } from "react";

export type FoundationStatus = "Stable" | "Beta" | "Deprecated" | "Experimental";

export interface FoundationHeaderProps {
  title: string;
  description: string;
  status?: FoundationStatus;
  version?: string;
  actions?: ReactNode;
}

interface FoundationStatusConfig {
  className: string;
  label: string;
}

const FOUNDATION_STATUS_CONFIG: Record<FoundationStatus, FoundationStatusConfig> = {
  Stable: {
    className: "foundation-header__badge--stable",
    label: "Stable",
  },
  Beta: {
    className: "foundation-header__badge--beta",
    label: "Beta",
  },
  Deprecated: {
    className: "foundation-header__badge--deprecated",
    label: "Deprecated",
  },
  Experimental: {
    className: "foundation-header__badge--experimental",
    label: "Experimental",
  },
};

function FoundationStatusBadge({ status }: { status: FoundationStatus }) {
  const statusConfig = FOUNDATION_STATUS_CONFIG[status];

  return (
    <span
      className={`foundation-header__badge ${statusConfig.className}`}
      aria-label={`Status: ${statusConfig.label}`}
    >
      {statusConfig.label}
    </span>
  );
}

FoundationStatusBadge.displayName = "FoundationStatusBadge";

export function FoundationHeader({
  title,
  description,
  status = "Stable",
  version,
  actions,
}: FoundationHeaderProps) {
  return (
    <header className="foundation-header">
      <div className="foundation-header__top-row">
        <h1 className="foundation-header__title">{title}</h1>

        <div className="foundation-header__meta-row">
          <FoundationStatusBadge status={status} />
          {version ? <span className="foundation-header__version">{version}</span> : null}
        </div>

        {actions ? <div className="foundation-header__actions">{actions}</div> : null}
      </div>

      <p className="foundation-header__description">{description}</p>
    </header>
  );
}

FoundationHeader.displayName = "FoundationHeader";
