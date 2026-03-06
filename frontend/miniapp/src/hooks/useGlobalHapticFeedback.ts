import { useEffect } from "react";
import { useTelegramHaptics } from "./useTelegramHaptics";

const CLICK_TARGETS = [
  "button",
  ".btn",
  ".miniapp-tab",
  "a[data-haptic='light']",
  "[role='button']",
].join(", ");

const TOGGLE_TARGETS = [
  "input[type='checkbox']",
  "input[type='radio']",
  "[role='switch']",
  "select",
].join(", ");

function isDisabled(el: Element): boolean {
  if (el.matches(":disabled")) return true;
  return el.closest("[aria-disabled='true']") != null;
}

export function useGlobalHapticFeedback() {
  const { impact, selectionChanged } = useTelegramHaptics();

  useEffect(() => {
    if (typeof document === "undefined") return;

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      const trigger = target.closest(CLICK_TARGETS);
      if (!trigger || isDisabled(trigger)) return;
      impact("light");
    };

    const onChange = (event: Event) => {
      const target = event.target as Element | null;
      if (!target) return;
      const trigger = target.closest(TOGGLE_TARGETS);
      if (!trigger || isDisabled(trigger)) return;
      impact("light");
      selectionChanged();
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("change", onChange, true);

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("change", onChange, true);
    };
  }, [impact, selectionChanged]);
}
