import type { SelectOption } from "@vpn-suite/shared/ui";
import { cn } from "@vpn-suite/shared";
import { Button, Input, Select } from "@vpn-suite/shared/ui";

export interface FilterBarProps {
  /** Search value (controlled) */
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  /** Status filter */
  statusOptions: SelectOption[];
  statusValue: string;
  onStatusChange: (value: string) => void;
  statusLabel?: string;
  /** Sort */
  sortOptions: SelectOption[];
  sortValue: string;
  onSortChange: (value: string) => void;
  sortLabel?: string;
  /** Optional: last seen / time window */
  lastSeenOptions?: SelectOption[];
  lastSeenValue?: string;
  onLastSeenChange?: (value: string) => void;
  lastSeenLabel?: string;
  /** Optional: row density toggle */
  density?: "compact" | "normal";
  onDensityChange?: () => void;
  densityLabel?: string;
  /** Optional: region filter */
  regionOptions?: SelectOption[];
  regionValue?: string;
  onRegionChange?: (value: string) => void;
  regionLabel?: string;
  className?: string;
}

/**
 * FilterBar pattern (admin): search + status + sort + optional lastSeen, density, region.
 * Used by Servers page; keeps URL sync and behavior in the parent.
 * Reuse on any list page that needs the same filters (e.g. future Peers global view).
 */
export function FilterBar({
  search,
  onSearch,
  searchPlaceholder = "Search…",
  searchLabel = "Search",
  statusOptions,
  statusValue,
  onStatusChange,
  statusLabel = "Filter by status",
  sortOptions,
  sortValue,
  onSortChange,
  sortLabel = "Sort by",
  lastSeenOptions,
  lastSeenValue,
  onLastSeenChange,
  lastSeenLabel = "Show seen within",
  density,
  onDensityChange,
  densityLabel = "Row density",
  regionOptions,
  regionValue,
  onRegionChange,
  regionLabel = "Region",
  className = "",
}: FilterBarProps) {
  return (
    <div className={cn("ref-filter-bar", className)} role="search">
      <Input
        type="search"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        aria-label={searchLabel}
        className="ref-search-input"
      />
      <Select
        options={statusOptions}
        value={statusValue}
        onChange={onStatusChange}
        aria-label={statusLabel}
        className="ref-status-filter"
      />
      <Select
        options={sortOptions}
        value={sortValue}
        onChange={onSortChange}
        aria-label={sortLabel}
        className="ref-sort-select"
      />
      {lastSeenOptions != null && onLastSeenChange != null && (
        <Select
          options={lastSeenOptions}
          value={lastSeenValue ?? "all"}
          onChange={onLastSeenChange}
          aria-label={lastSeenLabel}
          className="ref-last-seen-filter"
        />
      )}
      {regionOptions != null && regionValue != null && onRegionChange != null && (
        <Select
          options={regionOptions}
          value={regionValue}
          onChange={onRegionChange}
          aria-label={regionLabel}
          className="ref-region-filter"
        />
      )}
      {density != null && onDensityChange != null && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDensityChange}
          aria-pressed={density === "compact"}
          aria-label={densityLabel}
        >
          {density === "compact" ? "Compact" : "Normal"}
        </Button>
      )}
    </div>
  );
}
