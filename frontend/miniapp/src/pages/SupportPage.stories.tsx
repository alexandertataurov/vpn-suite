import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { SupportPage } from "./Support";
import { loggedOutScenario, PageSandbox, readyScenario } from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Contracts/Support",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Support route contract for contact actions, FAQ disclosure, troubleshooter flow, and session failure handling.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ContactOptions: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/support"]}>
      <Route path="/support" element={<SupportPage />} />
    </PageSandbox>
  ),
};

export const Troubleshooter: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/support"]}>
      <Route path="/support" element={<SupportPage />} />
    </PageSandbox>
  ),
};

export const SessionMissing: Story = {
  render: () => (
    <PageSandbox scenario={loggedOutScenario} initialEntries={["/support"]}>
      <Route path="/support" element={<SupportPage />} />
    </PageSandbox>
  ),
};
