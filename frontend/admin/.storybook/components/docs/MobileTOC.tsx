import { useState } from "react";
import { IconButton } from "../../design-system-compat";
import { List } from "lucide-react";
import type { TOCHeading } from "./useTOC";

export interface MobileTOCProps {
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
    <ul className="docs-toc-mobile__list">
      {items.map((item) => {
        const isActive = item.id === activeId;
        const levelClass =
          item.level === 2
            ? "docs-toc-mobile__link--level-2"
            : item.level === 3
              ? "docs-toc-mobile__link--level-3"
              : "docs-toc-mobile__link--level-4";

        return (
          <li key={item.id} className="docs-toc-mobile__item">
            <button
              type="button"
              className={[
                "docs-toc-mobile__link",
                levelClass,
                isActive ? "docs-toc-mobile__link--active" : "",
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

export function MobileTOC({ headings, activeId, onNavigate }: MobileTOCProps) {
  const [open, setOpen] = useState(false);

  if (headings.length === 0) return null;

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setOpen(false);
  };

  return (
    <>
      <div className="docs-toc-mobile-trigger">
        <IconButton
          variant="primary"
          size="md"
          icon={<List className="h-5 w-5" aria-hidden="true" />}
          aria-label="On this page"
          onClick={() => setOpen(true)}
        />
      </div>

      {open && (
        <div className="docs-toc-mobile" aria-modal="true" role="dialog">
          <button
            type="button"
            className="docs-toc-mobile__backdrop"
            aria-label="Close On this page navigation"
            onClick={() => setOpen(false)}
          />
          <div className="docs-toc-mobile__sheet">
            <header className="docs-toc-mobile__header">
              <span className="docs-toc-mobile__title">On this page</span>
              <IconButton
                variant="ghost"
                size="md"
                icon={<span className="docs-toc-mobile__close-icon" aria-hidden>&times;</span>}
                aria-label="Close"
                onClick={() => setOpen(false)}
              />
            </header>
            <div className="docs-toc-mobile__body">
              <HeadingList
                items={headings}
                activeId={activeId}
                onNavigate={handleNavigate}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

