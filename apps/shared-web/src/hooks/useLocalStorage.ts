import { useCallback, useState } from "react";

// Why: centralize localStorage error handling and SSR-safe behavior.
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item != null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      setStored(value);
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Intentionally ignore storage errors so UI flows stay functional.
      }
    },
    [key]
  );

  return [stored, setValue];
}

