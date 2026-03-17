import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { DevicesPage } from "./Devices";
import { limitReachedScenario, PageSandbox, readyScenario } from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Devices",
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "Device management." } },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/devices"]}>
      <Route path="/devices" element={<DevicesPage />} />
      <Route path="/devices/issue" element={<DevicesPage />} />
    </PageSandbox>
  ),
};

export const LimitReached: Story = {
  render: () => (
    <PageSandbox scenario={limitReachedScenario} initialEntries={["/devices"]}>
      <Route path="/devices" element={<DevicesPage />} />
      <Route path="/devices/issue" element={<DevicesPage />} />
    </PageSandbox>
  ),
};
