import { useEffect, useState } from "react";

export interface OfflineBannerProps {
  visible?: boolean;
  message?: string;
  hint?: string;
}

/**
 * Offline banner; fixed top, non-dismissible, and auto-hides when connectivity returns.
 */
export function OfflineBanner({
  visible,
  message = "YOU ARE OFFLINE.",
  hint = "Actions will resume when connection is restored.",
}: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === "undefined" || visible != null) return;
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [visible]);

  const isVisible = visible ?? !isOnline;
  if (!isVisible) return null;

  return (
    <div className="miniapp-offline-banner" role="alert" aria-live="polite">
      <span className="miniapp-offline-banner-dot" aria-hidden />
      <span className="miniapp-offline-banner-text">{message}</span>
      <span className="miniapp-offline-banner-separator" aria-hidden>
        ·
      </span>
      <span className="miniapp-offline-banner-hint">{hint}</span>
    </div>
  );
}
