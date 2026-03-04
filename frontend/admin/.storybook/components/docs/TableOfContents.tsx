import type { TOCHeading } from "./useTOC";

export interface TableOfContentsProps {
  headings: TOCHeading[];
  activeId: string | null;
  onNavigate: (id: string) => void;
}

function HeadingList({
  items,
  activeId,
  onNavigate,
}: {
  items: TOCHeading[];
  activeId: string | null;
  onNavigate: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <ul className="docs-toc__list">
      {items.map((item) => {
        const isActive = item.id === activeId;
        const levelClass =
          item.level === 2
            ? "docs-toc__link--level-2"
            : item.level === 3
              ? "docs-toc__link--level-3"
              : "docs-toc__link--level-4";

        return (
          <li key={item.id} className="docs-toc__item">
            <button
              type="button"
              className={[
                "docs-toc__link",
                levelClass,
                isActive ? "docs-toc__link--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={isActive ? "true" : undefined}
              onClick={() => onNavigate(item.id)}
            >
              {item.text}
            </button>
            {item.children.length > 0 && (
              <HeadingList
                items={item.children}
                activeId={activeId}
                onNavigate={onNavigate}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function TableOfContents({
  headings,
  activeId,
  onNavigate,
}: TableOfContentsProps) {
  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="docs-toc" aria-label="On this page">
      <div className="docs-toc__title">On this page</div>
      <HeadingList items={headings} activeId={activeId} onNavigate={onNavigate} />
    </nav>
  );
}

