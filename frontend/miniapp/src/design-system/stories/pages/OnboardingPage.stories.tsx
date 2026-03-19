import type { Meta, StoryObj } from "@storybook/react";
import {
  emptyDevicesScenario,
  noPlanScenario,
  OnboardingSandbox,
  readyScenario,
} from "@/storybook/page-contracts";
import { Route } from "react-router-dom";
import { OnboardingPage } from "@/pages/Onboarding";

const pageStoryParameters = {
  layout: "fullscreen" as const,
  viewport: { defaultViewport: "iphone14" },
  status: { type: "stable" as const },
};

const meta: Meta = {
  title: "Pages/Contracts/Onboarding",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component: "Miniapp onboarding flow shown before the normal app-ready shell. Covers intro, app install, choose plan, add device, open VPN, and confirm connection.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Intro: Story = {
  name: "Welcome",
  render: () => (
    <OnboardingSandbox scenario={readyScenario} initialEntries={["/onboarding"]} step={0}>
      <Route path="/onboarding" element={<OnboardingPage />} />
    </OnboardingSandbox>
  ),
};

export const InstallApp: Story = {
  name: "Install AmneziaVPN",
  render: () => (
    <OnboardingSandbox scenario={readyScenario} initialEntries={["/onboarding"]} step={1}>
      <Route path="/onboarding" element={<OnboardingPage />} />
    </OnboardingSandbox>
  ),
};

export const ChoosePlan: Story = {
  name: "Choose plan",
  render: () => (
    <OnboardingSandbox scenario={noPlanScenario} initialEntries={["/onboarding"]} step={2}>
      <Route path="/onboarding" element={<OnboardingPage />} />
    </OnboardingSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Get-config step when the user has not purchased a plan yet.",
      },
    },
  },
};

export const AddFirstDevice: Story = {
  name: "Add first device",
  render: () => (
    <OnboardingSandbox scenario={emptyDevicesScenario} initialEntries={["/onboarding"]} step={2}>
      <Route path="/onboarding" element={<OnboardingPage />} />
    </OnboardingSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Get-config step when the user has a plan but no issued device yet.",
      },
    },
  },
};

export const OpenVpn: Story = {
  name: "Open VPN app",
  render: () => (
    <OnboardingSandbox scenario={readyScenario} initialEntries={["/onboarding"]} step={3}>
      <Route path="/onboarding" element={<OnboardingPage />} />
    </OnboardingSandbox>
  ),
};

export const ConfirmConnection: Story = {
  name: "Confirm connection",
  render: () => (
    <OnboardingSandbox scenario={readyScenario} initialEntries={["/onboarding"]} step={4}>
      <Route path="/onboarding" element={<OnboardingPage />} />
    </OnboardingSandbox>
  ),
};
