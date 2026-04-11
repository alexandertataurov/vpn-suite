import "./preview-init";
import type { Preview } from "@storybook/react";
import { withMiniAppShell } from "../src/storybook/decorators/withMiniAppShell";
import { withTelegramEnvironment } from "../src/storybook/telegramEnvironment";
import { DocsCallout } from "../src/stories/docs/components/DocsCallout";
import { DocsPage } from "../src/stories/docs/DocsPage";
import { ThemedDocsContainer } from "../src/stories/docs/ThemedDocsContainer";
import "../src/stories/docs/docs.css";
import { storybookDocsMdxComponents } from "../src/stories/docs/presentation";
import "../src/design-system/styles/index.css";
import "../src/design-system/styles/layout-story.css";
import "../src/styles/app/index.css";
import "../src/storybook/preview.css";
import "../src/stories/docs/presentation/storybookDocsBlocks.css";

const STORYBOOK_GLOBAL_TYPES: Preview["globalTypes"] = {
  theme: {
    description: "Story theme",
    toolbar: {
      title: "Theme",
      icon: "mirror",
      items: [
        { value: "light", title: "Light" },
        { value: "dark", title: "Dark" },
        { value: "system", title: "System" },
      ],
      dynamicTitle: true,
    },
  },
  tokenMode: {
    description: "Token mode for foundations (semantic vs primitives)",
    toolbar: {
      title: "Tokens",
      icon: "layers",
      items: [
        { value: "semantic", title: "Semantic" },
        { value: "primitives", title: "Primitives" },
      ],
      dynamicTitle: true,
    },
  },
  density: {
    description: "Density for card and list presentation",
    toolbar: {
      title: "Density",
      icon: "table",
      items: [
        { value: "compact", title: "Compact" },
        { value: "default", title: "Default" },
        { value: "comfortable", title: "Comfortable" },
      ],
      dynamicTitle: true,
    },
  },
  animations: {
    description: "Motion preference override",
    toolbar: {
      title: "Animations",
      icon: "play",
      items: [
        { value: "system", title: "System" },
        { value: "always-on", title: "Always on" },
        { value: "reduced", title: "Reduced" },
      ],
      dynamicTitle: true,
    },
  },
};

const STORYBOOK_INITIAL_GLOBALS: Preview["initialGlobals"] = {
  theme: "system",
  tokenMode: "semantic",
  density: "default",
  animations: "system",
};

const STORYBOOK_VIEWPORTS = {
  mobile390: {
    name: "Mobile 390",
    styles: { width: "390px", height: "844px" },
    type: "mobile",
  },
  tablet768: {
    name: "Tablet 768",
    styles: { width: "768px", height: "1024px" },
    type: "tablet",
  },
  desktop: {
    name: "Desktop",
    styles: { width: "1280px", height: "800px" },
    type: "desktop",
  },
} as const;

const STORYBOOK_STATUS_DEFINITIONS = {
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
} as const;

const preview: Preview = {
  globalTypes: STORYBOOK_GLOBAL_TYPES,
  initialGlobals: STORYBOOK_INITIAL_GLOBALS,
  decorators: [withTelegramEnvironment, withMiniAppShell],
  parameters: {
    layout: "fullscreen",
    toolbar: {
      tokenMode: { hidden: true },
    },
    viewport: {
      options: STORYBOOK_VIEWPORTS,
      defaultViewport: "mobile390",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      container: ThemedDocsContainer,
      page: DocsPage,
      components: {
        Callout: DocsCallout,
        ...storybookDocsMdxComponents,
      },
    },
    status: {
      statuses: STORYBOOK_STATUS_DEFINITIONS,
    },
    options: {
      storySort: {
        order: [
          "Introduction",
          ["Overview", "Contribution Rules"],
          "Foundations",
          [
            "Overview",
            "Color",
            "Typography",
            "Spacing",
            "Radius",
            "Shadows",
            "Layout",
            "Motion",
            "Icons",
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
              "Home",
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
