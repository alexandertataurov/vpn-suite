import React from "react";
import { addons, types } from "@storybook/manager-api";
import { DesignTokensPanel } from "./DesignTokensPanel";

const ADDON_ID = "design-tokens";
const PANEL_ID = `${ADDON_ID}/panel`;

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: "Design Tokens",
    render: ({ active }) => (active ? <DesignTokensPanel /> : null),
  });
});
