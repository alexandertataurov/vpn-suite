import "./foundationLinks.css";

export interface FoundationLinksProps {
  figma?: string;
  tokens?: string;
  code?: string;
}

type FoundationResourceLinkKey = keyof FoundationLinksProps;

interface FoundationResourceLinkDefinition {
  key: FoundationResourceLinkKey;
  label: string;
  icon: string;
  ariaLabel: string;
}

interface FoundationResourceLinkItem {
  href: string;
  icon: string;
  label: string;
  ariaLabel: string;
}

const FOUNDATION_RESOURCE_LINK_DEFINITIONS: readonly FoundationResourceLinkDefinition[] = [
  {
    key: "figma",
    label: "Figma",
    icon: "❖",
    ariaLabel: "Open in Figma",
  },
  {
    key: "tokens",
    label: "Tokens",
    icon: "{}",
    ariaLabel: "View token source",
  },
  {
    key: "code",
    label: "Code",
    icon: "⌥",
    ariaLabel: "View code reference",
  },
];

function buildFoundationResourceLinks({
  code,
  figma,
  tokens,
}: FoundationLinksProps): FoundationResourceLinkItem[] {
  const resourceLinks: Record<FoundationResourceLinkKey, string | undefined> = {
    code,
    figma,
    tokens,
  };

  return FOUNDATION_RESOURCE_LINK_DEFINITIONS.flatMap(({ ariaLabel, icon, key, label }) => {
    const href = resourceLinks[key];
    return href ? [{ ariaLabel, href, icon, label }] : [];
  });
}

/**
 * Compact external-link strip for Foundation documentation pages.
 * Renders only the links whose props are provided; returns null if none.
 */
export function FoundationLinks(props: FoundationLinksProps) {
  const resourceLinks = buildFoundationResourceLinks(props);

  if (resourceLinks.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Foundation resources" className="foundation-links">
      {resourceLinks.map(({ ariaLabel, href, icon, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ariaLabel}
          className="foundation-links__link"
        >
          <span className="foundation-links__icon" aria-hidden="true">
            {icon}
          </span>
          {label}
        </a>
      ))}
    </nav>
  );
}

FoundationLinks.displayName = "FoundationLinks";
