import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { OnboardingPage } from "./Onboarding";
import { OnboardingSandbox, readyScenario } from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Onboarding",
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "Onboarding flow." } },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <OnboardingSandbox scenario={readyScenario} initialEntries={["/onboarding"]}>
      <Route path="/onboarding" element={<OnboardingPage />} />
    </OnboardingSandbox>
  ),
};
