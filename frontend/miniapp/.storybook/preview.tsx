import type { Preview } from "@storybook/react";
import React from "react";
import { withTelegramEnvironment } from "../src/storybook/telegramEnvironment";
import { withMiniAppShell } from "../src/storybook/decorators/withMiniAppShell";
import "../src/design-system/styles/index.css";
import "../src/design-system/styles/layout-story.css";
import "../src/styles/app/index.css";
import "../src/storybook/preview.css";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Consumer theme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "consumer-dark", title: "Consumer Dark" },
          { value: "consumer-light", title: "Consumer Light" },
        ],
        dynamicTitle: true,
      },
    },
    viewportWidth: {
      description: "Page preview width",
      toolbar: {
        title: "Viewport",
        icon: "browser",
        items: [
          { value: "390", title: "sm 390" },
          { value: "430", title: "phone 430" },
          { value: "600", title: "md 600" },
          { value: "1024", title: "xl 1024" },
        ],
        dynamicTitle: true,
      },
    },
    tgPlatform: {
      description: "Telegram platform environment",
      toolbar: {
        title: "Platform",
        icon: "mobile",
        items: [
          { value: "ios", title: "iOS" },
          { value: "android", title: "Android" },
          { value: "other", title: "Desktop" },
        ],
        dynamicTitle: true,
      },
    },
    tgFullscreen: {
      description: "Telegram fullscreen environment",
      toolbar: {
        title: "Fullscreen",
        icon: "browser",
        items: [
          { value: "false", title: "Windowed" },
          { value: "true", title: "Fullscreen" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "consumer-dark",
    viewportWidth: "390",
    tgPlatform: "ios",
    tgFullscreen: "false",
  },
  decorators: [
    withTelegramEnvironment,
    withMiniAppShell,
  ],
  parameters: {
    layout: "fullscreen",
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    status: {
      statuses: {
        stable: {
          background: "#f0fdf4",
          color: "#166534",
          description: "Production ready",
        },
        beta: {
          background: "#fffbeb",
          color: "#92400e",
          description: "In progress",
        },
        deprecated: {
          background: "#fef2f2",
          color: "#991b1b",
          description: "Do not use",
        },
      },
    },
    options: {
      storySort: {
        order: [
          "Foundations",
          [
            "Overview",
            "Color",
            "Typography",
            "Spacing",
            "Layout",
            "Radius",
            "Shadows",
            "Motion",
            "Accessibility",
          ],
          "Primitives",
          [
            "Overview",
            "Box",
            "Container",
            "Stack",
            "Inline",
            "Panel",
            "Divider",
            "Text",
            "Heading",
          ],
          "Patterns",
          "Layouts",
          "Pages",
          "States",
          "*",
        ],
      },
    },
  },
};

export default preview;
