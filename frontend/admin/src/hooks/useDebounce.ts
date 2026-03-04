import { useEffect, useState } from "react";

/**
 * Purpose: Debounce a value for filter inputs / search.
 * Used in: UsersPage filter bar, any search/filter input.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
