/**
 * Scrolls focused input into view on keyboard open. Fixes iOS scroll freeze
 * and input-hidden-under-keyboard issues.
 */
import { useEffect } from "react";

export function useScrollInputIntoView() {
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target?.isConnected &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
    };
    document.addEventListener("focusin", handleFocusIn);
    return () => document.removeEventListener("focusin", handleFocusIn);
  }, []);
}
