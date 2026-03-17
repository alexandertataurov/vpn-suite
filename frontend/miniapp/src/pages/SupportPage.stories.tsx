import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { SupportPage } from "./Support";
import { PageSandbox, readyScenario } from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Support",
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "Support and help." } },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/support"]}>
      <Route path="/support" element={<SupportPage />} />
    </PageSandbox>
  ),
};
