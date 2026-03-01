import { useEffect, useState } from "react";

/**
 * Per guidelines: Offline banner; persistent; disable primary actions when offline.
 * Show "Retry" when back online.
 */
export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      className="miniapp-offline-banner"
      role="alert"
      aria-live="polite"
    >
      <span className="miniapp-offline-banner-text">You are offline.</span>
      <span className="miniapp-offline-banner-hint">Actions will resume when connection is restored.</span>
    </div>
  );
}
