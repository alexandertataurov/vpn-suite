import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { OnboardingPage } from "@/pages/Onboarding";
import { OnboardingSandbox, readyScenario } from "@/storybook/page-contracts";

const meta: Meta = {
  title: "Pages/Contracts/Onboarding",
  tags: ["autodocs"],
  parameters: {
    viewport: { defaultViewport: "iphone14" },
    docs: {
      description: {
        component: "Onboarding flow. Contract tests.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <OnboardingSandbox scenario={readyScenario} initialEntries={["/onboarding"]}>
      <Route path="/onboarding" element={<OnboardingPage />} />
    </OnboardingSandbox>
  ),
};
