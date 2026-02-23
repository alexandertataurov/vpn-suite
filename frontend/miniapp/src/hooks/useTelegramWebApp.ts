declare global {
  interface Window {
    Telegram?: { WebApp?: { initData: string; ready: () => void } };
  }
}

export function useTelegramWebApp() {
  const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
  return {
    initData: tg?.initData ?? "",
    isInsideTelegram: !!tg?.initData,
    openLink: (url: string) => (tg as { openLink?: (u: string) => void })?.openLink?.(url),
  };
}
