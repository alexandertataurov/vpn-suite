import type { SelectOption } from "@/design-system";
import { cn } from "@vpn-suite/shared";
import { Button, Input, Select } from "@/design-system";

export interface FilterBarProps {
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  statusOptions: SelectOption[];
  statusValue: string;
  onStatusChange: (value: string) => void;
  statusLabel?: string;
  sortOptions: SelectOption[];
  sortValue: string;
  onSortChange: (value: string) => void;
  sortLabel?: string;
  lastSeenOptions?: SelectOption[];
  lastSeenValue?: string;
  onLastSeenChange?: (value: string) => void;
  lastSeenLabel?: string;
  density?: "compact" | "normal";
  onDensityChange?: () => void;
  densityLabel?: string;
  viewMode?: "table" | "node-commander";
  onViewModeChange?: (m: "table" | "node-commander") => void;
  regionOptions?: SelectOption[];
  regionValue?: string;
  onRegionChange?: (value: string) => void;
  regionLabel?: string;
  className?: string;
}

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
  viewMode,
  onViewModeChange,
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
      {viewMode != null && onViewModeChange != null && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewModeChange(viewMode === "table" ? "node-commander" : "table")}
          aria-pressed={viewMode === "node-commander"}
          aria-label="Toggle view mode"
        >
          {viewMode === "table" ? "HUD" : "Table"}
        </Button>
      )}
    </div>
  );
}
