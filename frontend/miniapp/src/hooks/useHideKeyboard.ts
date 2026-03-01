/**
 * Per guidelines: Use hideKeyboard() (Bot API 9.1+) when appropriate.
 * Call on form submit or when dismissing input focus.
 */
export function useHideKeyboard() {
  return () => {
    if (typeof window === "undefined") return;
    const tg = (window as Window & { Telegram?: { WebApp?: { hideKeyboard?: () => void } } }).Telegram?.WebApp;
    tg?.hideKeyboard?.();
  };
}
