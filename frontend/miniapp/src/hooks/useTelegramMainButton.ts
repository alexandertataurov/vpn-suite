import { useEffect } from "react";
import { useMainButton } from "./controls/useMainButton";
import { useHaptics } from "./system/useHaptics";
import { useMainButtonReserve } from "../context/MainButtonReserveContext";

interface MainButtonOptions {
  text: string;
  visible?: boolean;
  enabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

export function useTelegramMainButton(options: MainButtonOptions | null) {
  const mainButton = useMainButton();
  const { impact } = useHaptics();
  const { setReserve } = useMainButtonReserve();

  useEffect(() => {
    const visible = options !== null && options?.visible !== false;
    setReserve(visible);
  }, [options, setReserve]);

  useEffect(() => {
    if (!options) {
      mainButton.setProgress(false);
      mainButton.hide();
      return;
    }

    const { text, visible = true, enabled = true, loading = false, onClick } = options;

    mainButton.setText(text);
    if (visible) mainButton.show();
    else mainButton.hide();

    if (enabled) mainButton.enable();
    else mainButton.disable();

    mainButton.setProgress(loading);

    const off = mainButton.onClick(() => {
      impact("light");
      onClick();
    });

    return () => {
      off();
      mainButton.setProgress(false);
      mainButton.hide();
    };
  }, [impact, mainButton, options]);
}

