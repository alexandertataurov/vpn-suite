import { useCallback } from "react";
import { telegramClient } from "@/telegram/telegramClient";

export function useCloudStorage() {
  const getItem = useCallback(async (key: string) => {
    return telegramClient.cloudGetItem(key);
  }, []);

  const setItem = useCallback(async (key: string, value: string) => {
    await telegramClient.cloudSetItem(key, value);
  }, []);

  const removeItem = useCallback(async (key: string) => {
    await telegramClient.cloudRemoveItem(key);
  }, []);

  const getKeys = useCallback(async () => {
    return telegramClient.cloudGetKeys();
  }, []);

  return { getItem, setItem, removeItem, getKeys };
}

