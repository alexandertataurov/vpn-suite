import "./preview-init";
import type { Preview } from "@storybook/react";
import React from "react";
import { withTelegramEnvironment } from "../src/storybook/telegramEnvironment";
import { withMiniAppShell } from "../src/storybook/decorators/withMiniAppShell";
import { ThemedDocsContainer } from "./ThemedDocsContainer";
import { DocsPage } from "./DocsPage";
import { DocsCallout } from "./components/DocsCallout";
import "../src/design-system/styles/index.css";
import "../src/design-system/styles/layout-story.css";
import "../src/styles/app/index.css";
import "../src/storybook/preview.css";
import "./docs.css";

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
    forceAnimations: {
      description: "Bypass prefers-reduced-motion (show animations in Storybook)",
      toolbar: {
        title: "Force animations",
        icon: "play",
        items: [
          { value: "false", title: "Respect reduced motion" },
          { value: "true", title: "Force animations" },
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
    forceAnimations: "true",
  },
  decorators: [
    withTelegramEnvironment,
    withMiniAppShell,
  ],
  parameters: {
    layout: "fullscreen",
    /* viewport: iframe size. viewportWidth global (below) controls shell data-viewport-width.
       Keep initialGlobals.viewportWidth aligned with defaultViewport for consistent Mini App context. */
    viewport: {
      viewports: {
        iphoneSE: {
          name: "iPhone SE (320px)",
          styles: { width: "320px", height: "568px" },
          type: "mobile",
        },
        iphone14: {
          name: "iPhone 14 (390px)",
          styles: { width: "390px", height: "844px" },
          type: "mobile",
        },
        iphone14Plus: {
          name: "iPhone 14 Plus (430px)",
          styles: { width: "430px", height: "932px" },
          type: "mobile",
        },
        adminDesktop: {
          name: "Admin Desktop (1280px)",
          styles: { width: "1280px", height: "800px" },
          type: "desktop",
        },
      },
      defaultViewport: "iphone14",
    },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    docs: {
      container: ThemedDocsContainer,
      page: DocsPage,
      components: {
        Callout: DocsCallout,
      },
    },
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
          "Components",
          "Patterns",
          "Recipes",
          "Layouts",
          [
            "Pages",
            [
              "Home", // legacy alias pages-home--home
              "Contracts",
              [
                "Home",
                "SplashAndLoading",
                "ConnectStatus",
                "Plan",
                "Devices",
                "Devices Interactions",
                "Onboarding",
                "Checkout",
                "Settings",
                "Settings Interactions",
                "Support",
                "RestoreAccess",
              ],
            ],
          ],
          "States",
          "*",
        ],
      },
    },
  },
};

export default preview;
