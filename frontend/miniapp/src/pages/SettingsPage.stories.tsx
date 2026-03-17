import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { SettingsPage } from "./Settings";
import { PageSandbox, readyScenario } from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Settings",
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "Account and settings." } },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
};
