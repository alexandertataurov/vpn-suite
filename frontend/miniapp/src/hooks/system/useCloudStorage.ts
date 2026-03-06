import { useCallback } from "react";
import { telegramFeatureClient } from "@/telegram/telegramFeatureClient";

export function useCloudStorage() {
  const getItem = useCallback(async (key: string) => {
    return telegramFeatureClient.cloudGetItem(key);
  }, []);

  const setItem = useCallback(async (key: string, value: string) => {
    await telegramFeatureClient.cloudSetItem(key, value);
  }, []);

  const removeItem = useCallback(async (key: string) => {
    await telegramFeatureClient.cloudRemoveItem(key);
  }, []);

  const getKeys = useCallback(async () => {
    return telegramFeatureClient.cloudGetKeys();
  }, []);

  return { getItem, setItem, removeItem, getKeys };
}
