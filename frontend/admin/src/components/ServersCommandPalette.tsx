/**
 * cmdk-based command palette for Servers page.
 * Groups: Servers (search by name/IP/region), Actions, Navigation.
 */
import { Command } from "cmdk";
import { useCallback, useEffect } from "react";

export interface ServersCommandItem {
  id: string;
  label: string;
  keywords?: string;
  onSelect: () => void;
}

export interface ServersCommandGroup {
  heading: string;
  items: ServersCommandItem[];
}

export interface ServersCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  groups: ServersCommandGroup[];
}

export function ServersCommandPalette({
  open,
  onClose,
  groups,
}: ServersCommandPaletteProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleSelect = useCallback(
    (fn: () => void) => {
      fn();
      onClose();
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <div
      className="command-palette-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Command
        className="command-palette-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <Command.Input
          placeholder="Search servers, actions…"
          className="command-palette-input"
          autoFocus
        />
        <Command.List className="command-palette-list">
          <Command.Empty className="command-palette-empty">
            No results found.
          </Command.Empty>
          {groups.map((group) => (
            <Command.Group key={group.heading} heading={group.heading}>
              <div className="command-palette-group-heading">
                {group.heading}
              </div>
              {group.items.map((item) => (
                <Command.Item
                  key={item.id}
                  value={`${item.label} ${item.keywords ?? ""}`}
                  onSelect={() => handleSelect(item.onSelect)}
                  className="command-palette-item"
                >
                  {item.label}
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
