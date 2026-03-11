import { useEffect } from "react";
import type { Decorator } from "@storybook/react";

export type TelegramPlatform = "ios" | "android" | "other";

type TelegramEnvironment = {
  platform: TelegramPlatform;
  fullscreen: boolean;
};

type SafeInsets = {
  top: string;
  bottom: string;
};

const windowedSafeInsets: Record<TelegramPlatform, SafeInsets> = {
  ios: { top: "20px", bottom: "34px" },
  android: { top: "24px", bottom: "0px" },
  other: { top: "0px", bottom: "0px" },
};

const fullscreenSafeInsets: Record<TelegramPlatform, SafeInsets> = {
  ios: { top: "59px", bottom: "34px" },
  android: { top: "24px", bottom: "24px" },
  other: { top: "0px", bottom: "0px" },
};

export function applyTelegramEnvironment({ platform, fullscreen }: TelegramEnvironment) {
  const root = document.documentElement;
  const safeInsets = fullscreen ? fullscreenSafeInsets[platform] : windowedSafeInsets[platform];

  root.setAttribute("data-tg-platform", platform);
  root.setAttribute("data-tg-fullscreen", String(fullscreen));

  if (platform === "other") {
    root.setAttribute("data-tg-desktop", "true");
  } else {
    root.removeAttribute("data-tg-desktop");
  }

  root.style.setProperty("--tg-top", safeInsets.top);
  root.style.setProperty("--tg-bottom", safeInsets.bottom);
  root.style.setProperty("--tg-left", "0px");
  root.style.setProperty("--tg-right", "0px");
}

function TelegramEnvironmentDecorator({
  Story,
  fullscreen,
  platform,
}: {
  Story: () => JSX.Element;
  fullscreen: boolean;
  platform: TelegramPlatform;
}) {
  useEffect(() => {
    const root = document.documentElement;
    const previous = {
      platform: root.getAttribute("data-tg-platform"),
      fullscreen: root.getAttribute("data-tg-fullscreen"),
      desktop: root.getAttribute("data-tg-desktop"),
      top: root.style.getPropertyValue("--tg-top"),
      bottom: root.style.getPropertyValue("--tg-bottom"),
      left: root.style.getPropertyValue("--tg-left"),
      right: root.style.getPropertyValue("--tg-right"),
    };

    applyTelegramEnvironment({ platform, fullscreen });

    return () => {
      if (previous.platform == null) root.removeAttribute("data-tg-platform");
      else root.setAttribute("data-tg-platform", previous.platform);

      if (previous.fullscreen == null) root.removeAttribute("data-tg-fullscreen");
      else root.setAttribute("data-tg-fullscreen", previous.fullscreen);

      if (previous.desktop == null) root.removeAttribute("data-tg-desktop");
      else root.setAttribute("data-tg-desktop", previous.desktop);

      root.style.setProperty("--tg-top", previous.top);
      root.style.setProperty("--tg-bottom", previous.bottom);
      root.style.setProperty("--tg-left", previous.left);
      root.style.setProperty("--tg-right", previous.right);
    };
  }, [fullscreen, platform]);

  return <Story />;
}

export const withTelegramEnvironment: Decorator = (Story, context) => {
  const platform = (context.globals.tgPlatform ?? "ios") as TelegramPlatform;
  const fullscreen = String(context.globals.tgFullscreen ?? "false") === "true";

  return (
    <TelegramEnvironmentDecorator
      Story={Story as () => JSX.Element}
      platform={platform}
      fullscreen={fullscreen}
    />
  );
};
