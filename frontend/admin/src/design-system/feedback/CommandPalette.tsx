import { useEffect, useRef, useState, useMemo } from "react";
import { Input } from "../primitives/Input";
import { cn } from "@vpn-suite/shared";

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

function matchQuery(q: string, label: string, kw?: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const t = (label + " " + (kw ?? "")).toLowerCase();
  return t.includes(s) || s.split(/\s+/).every((w) => t.includes(w));
}

export function CommandPalette({ open, onClose, items }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => items.filter((i) => matchQuery(query, i.label, i.keywords)), [items, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSel(0);
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => { setSel((i) => (filtered.length ? Math.min(i, filtered.length - 1) : 0)); }, [filtered.length]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown") { e.preventDefault(); setSel((i) => (i + 1) % Math.max(1, filtered.length)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSel((i) => (i - 1 + filtered.length) % Math.max(1, filtered.length)); }
      else if (e.key === "Enter" && filtered[sel]) { e.preventDefault(); filtered[sel].onSelect(); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose, filtered, sel]);

  useEffect(() => {
    const el = listRef.current;
    if (el && sel >= 0 && el.children[sel]) (el.children[sel] as HTMLElement).scrollIntoView({ block: "nearest" });
  }, [sel]);

  if (!open) return null;

  return (
    <div className="ds-command-palette-overlay" role="dialog" aria-modal="true" aria-label="Command palette" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ds-command-palette" onClick={(e) => e.stopPropagation()}>
        <Input ref={inputRef} className="ds-command-palette-input" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div ref={listRef} className="ds-command-palette-list" role="listbox">
          {filtered.length === 0 ? <div className="ds-command-palette-empty">No results</div> : filtered.map((item, i) => (
            <button key={item.id} type="button" role="option" aria-selected={i === sel} className={cn("ds-command-palette-item", i === sel && "ds-command-palette-item--selected")} onMouseEnter={() => setSel(i)} onClick={() => item.onSelect()}>{item.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

CommandPalette.displayName = "CommandPalette";
