import { addons } from "storybook/manager-api";
import { darkTheme } from "../src/stories/docs/storybookTheme";

// Premium branding for the Storybook manager UI (sidebar + toolbar).
addons.setConfig({
  theme: darkTheme,
  sidebar: {
    showRoots: true,
    collapsedRoots: [],
    renderLabel: (item) => item.name,
  },
  toolbar: {
    title: { hidden: true },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
  },
  navSize: 280,
});
