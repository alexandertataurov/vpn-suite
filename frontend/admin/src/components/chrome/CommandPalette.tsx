import { useEffect, useRef, useState, useMemo } from "react";
import { SearchInput } from "@/design-system";

export interface CommandItem {
  id: string;
  label: string;
  keywords?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
}

function matchQuery(query: string, label: string, keywords?: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const text = `${label} ${keywords ?? ""}`.toLowerCase();
  return text.includes(q) || q.split(/\s+/).every((w) => text.includes(w));
}

export function CommandPalette({ open, onClose, items }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => items.filter((i) => matchQuery(query, i.label, i.keywords)),
    [items, query]
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedIndex(0);
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    setSelectedIndex((i) => (filtered.length ? Math.min(i, filtered.length - 1) : 0));
  }, [filtered.length]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % Math.max(1, filtered.length));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % Math.max(1, filtered.length));
        return;
      }
      if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].onSelect();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, filtered, selectedIndex]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || selectedIndex < 0) return;
    const item = el.children[selectedIndex] as HTMLElement;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div
      className="command-palette-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="command-palette"
        onClick={(e) => e.stopPropagation()}
      >
        <SearchInput
          ref={inputRef}
          className="command-palette-input"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-autocomplete="list"
          aria-controls="command-palette-list"
          aria-expanded={filtered.length > 0}
        />
        <div
          ref={listRef}
          id="command-palette-list"
          className="command-palette-list"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <div className="command-palette-empty">No results</div>
          ) : (
            filtered.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={i === selectedIndex}
                className={`command-palette-item ${i === selectedIndex ? "selected" : ""}`}
                onMouseEnter={() => setSelectedIndex(i)}
                onClick={() => item.onSelect()}
              >
                {item.label}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
