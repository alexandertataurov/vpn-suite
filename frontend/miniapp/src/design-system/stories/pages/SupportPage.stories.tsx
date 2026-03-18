import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { SupportPage } from "@/pages/Support";
import { PageSandbox, readyScenario } from "@/storybook/page-contracts";

const meta: Meta = {
  title: "Pages/Contracts/Support",
  tags: ["autodocs"],
  parameters: {
    viewport: { defaultViewport: "iphone14" },
    docs: {
      description: {
        component: "Support and help. Contract tests.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/support"]}>
      <Route path="/support" element={<SupportPage />} />
    </PageSandbox>
  ),
};
