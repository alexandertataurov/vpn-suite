import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { OnboardingSandbox, OnboardingStoryHarness, PlanStoryHarness, readyScenario } from "@/storybook/page-contracts";
import { DevicesPage } from "./Devices";
import { RestoreAccessPage } from "./RestoreAccess";

const meta = {
  title: "Pages/Contracts/Onboarding",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Onboarding bootstrap contract covering each major onboarding step against real route destinations instead of placeholders.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function renderStep(step: number) {
  return (
    <OnboardingSandbox scenario={readyScenario} initialEntries={["/onboarding"]}>
      <Route path="/onboarding" element={<OnboardingStoryHarness step={step} />} />
      <Route path="/plan" element={<PlanStoryHarness />} />
      <Route path="/devices" element={<DevicesPage />} />
      <Route path="/restore-access" element={<RestoreAccessPage />} />
    </OnboardingSandbox>
  );
}

export const Intro: Story = {
  render: () => renderStep(0),
};

export const Install: Story = {
  render: () => renderStep(1),
};

export const GetConfig: Story = {
  render: () => renderStep(2),
};

export const ConfirmConnected: Story = {
  render: () => renderStep(3),
};
