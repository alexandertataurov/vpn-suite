import { useEffect } from "react";

const DEBUG_QUERY_KEY = "layoutDebug";
const DEBUG_STORAGE_KEY = "miniapp-layout-debug";
const DEBUG_ATTR = "data-miniapp-debug";

function setDebug(enabled: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (enabled) {
    root.setAttribute(DEBUG_ATTR, "true");
  } else {
    root.removeAttribute(DEBUG_ATTR);
  }
}

export function useLayoutDebugMode() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const hasDebugQuery = params.get(DEBUG_QUERY_KEY) === "1";
    const storedDebug = window.localStorage.getItem(DEBUG_STORAGE_KEY) === "1";
    let enabled = hasDebugQuery || storedDebug;

    if (hasDebugQuery) {
      window.localStorage.setItem(DEBUG_STORAGE_KEY, "1");
    }

    setDebug(enabled);

    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || !event.shiftKey || event.code !== "KeyG") return;
      enabled = !enabled;
      if (enabled) {
        window.localStorage.setItem(DEBUG_STORAGE_KEY, "1");
      } else {
        window.localStorage.removeItem(DEBUG_STORAGE_KEY);
      }
      setDebug(enabled);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      setDebug(false);
    };
  }, []);
}
