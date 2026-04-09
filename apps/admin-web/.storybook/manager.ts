import { addons } from "storybook/manager-api";
import { darkTheme } from "./theme";

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
