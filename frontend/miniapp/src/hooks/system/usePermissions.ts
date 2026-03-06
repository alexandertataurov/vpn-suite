import { useCallback } from "react";
import { telegramFeatureClient } from "@/telegram/telegramFeatureClient";

export function usePermissions() {
  const requestWriteAccess = useCallback(async () => {
    return telegramFeatureClient.requestWriteAccess();
  }, []);

  const requestContact = useCallback(async () => {
    return telegramFeatureClient.requestContact();
  }, []);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) return null;
    return new Promise<GeolocationPosition | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 30000 },
      );
    });
  }, []);

  return { requestWriteAccess, requestContact, requestLocation };
}
