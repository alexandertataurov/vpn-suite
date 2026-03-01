import { IconChevronLeft, IconChevronRight } from "../icons";
import { cn } from "@vpn-suite/shared";

export interface PaginationProps {
  offset: number;
  limit: number;
  total: number;
  onPage: (offset: number) => void;
  className?: string;
}

export function Pagination(p: PaginationProps) {
  const { offset, limit, total, onPage, className } = p;
  const start = offset + 1;
  const end = Math.min(offset + limit, total);
  const canPrev = offset > 0;
  const canNext = offset + limit < total;
  return (
    <nav className={cn("ds-pagination", className)} role="navigation" aria-label="Pagination">
      <button type="button" className="ds-pagination-btn" onClick={() => onPage(Math.max(0, offset - limit))} disabled={!canPrev} aria-label="Previous page">
        <IconChevronLeft size={14} strokeWidth={1.5} aria-hidden />
      </button>
      <span className="ds-pagination-range"><strong>{start}–{end}</strong><span className="ds-pagination-total"> / {total}</span></span>
      <button type="button" className="ds-pagination-btn" onClick={() => onPage(offset + limit)} disabled={!canNext} aria-label="Next page">
        <IconChevronRight size={14} strokeWidth={1.5} aria-hidden />
      </button>
    </nav>
  );
}

Pagination.displayName = "Pagination";
