import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { ReferralPage } from "@/future/referral/Referral";
import { noReferralsScenario, PageSandbox, readyScenario } from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Contracts/Referral",
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "Referral program." } },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/referral"]}>
      <Route path="/referral" element={<ReferralPage />} />
    </PageSandbox>
  ),
};

export const NoReferrals: Story = {
  render: () => (
    <PageSandbox scenario={noReferralsScenario} initialEntries={["/referral"]}>
      <Route path="/referral" element={<ReferralPage />} />
    </PageSandbox>
  ),
};
