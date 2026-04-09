import { useCallback, useMemo, useState } from "react";

/**
 * Purpose: Page state and helpers for list UIs (1-based page, offset/limit).
 * Used in: UsersPage, any paginated list.
 */
export function usePagination(totalItems: number, itemsPerPage: number): {
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  offset: number;
  limit: number;
  next: () => void;
  prev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const [page, setPage] = useState(1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const offset = (safePage - 1) * itemsPerPage;
  const limit = itemsPerPage;
  const hasNext = safePage < totalPages;
  const hasPrev = safePage > 1;
  const next = useCallback(() => setPage((p) => Math.min(p + 1, totalPages)), [totalPages]);
  const prev = useCallback(() => setPage((p) => Math.max(p - 1, 1)), []);
  return useMemo(
    () => ({
      page: safePage,
      setPage,
      totalPages,
      offset,
      limit,
      next,
      prev,
      hasNext,
      hasPrev,
    }),
    [safePage, totalPages, offset, limit, next, prev, hasNext, hasPrev]
  );
}
