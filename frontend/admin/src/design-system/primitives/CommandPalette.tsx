import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

export interface CommandPaletteItem {
  id: string;
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  tag?: ReactNode;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  items: CommandPaletteItem[];
  onSelect: (item: CommandPaletteItem) => void;
  className?: string;
  placeholder?: string;
}

export function CommandPalette({
  open,
  onClose,
  query,
  onQueryChange,
  items,
  onSelect,
  className = "",
  placeholder = "Search…",
}: CommandPaletteProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
  }, [open, query, items.length]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;

    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const dir = event.key === "ArrowDown" ? 1 : -1;
      const next = (activeIndex + dir + items.length) % Math.max(items.length, 1);
      setActiveIndex(next);
      return;
    }

    if (event.key === "Enter" && items[activeIndex]) {
      event.preventDefault();
      onSelect(items[activeIndex]!);
    }
  };

  if (!open) return null;

  return (
    <div
      className="cmd-backdrop open"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className={["cmd-palette", className || null].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={handleKeyDown}
      >
        <div className="cmd-search-row">
          <svg
            className="cmd-search-icon"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <circle cx="7" cy="7" r="4.5" />
            <line x1="10.5" y1="10.5" x2="14" y2="14" />
          </svg>
          <input
            className="cmd-input"
            autoFocus
            placeholder={placeholder}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <span className="cmd-kbd">esc</span>
        </div>
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {items.length === 0 ? (
            <div className="cmd-group-label">No results</div>
          ) : (
            <div className="cmd-group-label">Results</div>
          )}
          {items.map((item, index) => {
            const selected = index === activeIndex;
            return (
              <div
                key={item.id}
                className={["cmd-item", selected ? "selected" : null].filter(Boolean).join(" ")}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelect(item);
                }}
              >
                {item.icon && <div className="cmd-item-icon">{item.icon}</div>}
                <div>
                  <div className="cmd-item-label">{item.label}</div>
                  {item.description && <div className="cmd-item-sub">{item.description}</div>}
                </div>
                {item.tag && <span className="cmd-item-tag">{item.tag}</span>}
              </div>
            );
          })}
        </div>
        <div className="cmd-footer">
          <span className="cmd-hint">
            <kbd className="cmd-kbd">↑↓</kbd> navigate
          </span>
          <span className="cmd-hint">
            <kbd className="cmd-kbd">↵</kbd> select
          </span>
          <span className="cmd-hint">
            <kbd className="cmd-kbd">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}

