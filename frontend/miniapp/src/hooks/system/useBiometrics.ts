import { useCallback } from "react";
import { telegramClient } from "@/telegram/telegramClient";

export function useBiometrics() {
  const biometrics = telegramClient.getBiometrics();
  const isAvailable = !!biometrics?.isBiometricAvailable;

  const requestAccess = useCallback(async () => {
    const manager = telegramClient.getBiometrics();
    if (!manager?.requestAccess) return false;
    return new Promise<boolean>((resolve) => {
      manager.requestAccess?.((granted: boolean) => resolve(!!granted));
    });
  }, []);

  const authenticate = useCallback(async () => {
    const manager = telegramClient.getBiometrics();
    if (!manager?.authenticate) return false;
    return new Promise<boolean>((resolve) => {
      manager.authenticate?.((ok: boolean) => resolve(!!ok));
    });
  }, []);

  return { isAvailable, requestAccess, authenticate };
}
