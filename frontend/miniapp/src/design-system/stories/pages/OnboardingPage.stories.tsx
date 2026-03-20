import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { OnboardingPage } from "@/pages/Onboarding";
import {
  type MockScenario,
  emptyDevicesScenario,
  noPlanScenario,
  OnboardingSandbox,
  pageStoryParameters,
  readyScenario,
} from "@/storybook/page-contracts";

const DOC_BODY = [
  "**Onboarding** (`/onboarding`): stepped flow before the standard app shell (welcome → install → plan/device → VPN → confirm).",
  "`OnboardingSandbox` pins the **visual step index** while still using real responses from `MockScenario` (e.g. `noPlanScenario` for choose-plan).",
  "Use together with **Home** / **Devices** stories for post-onboarding states.",
].join("\n\n");

const VIEW_NARROW = { viewport: { defaultViewport: "iphoneSE" as const } };

const meta = {
  title: "Pages/Contracts/Onboarding",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component: DOC_BODY,
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

type SandboxProps = {
  scenario: MockScenario;
  step: number;
  initialEntries?: string[];
};

function renderOnboarding({ scenario, step, initialEntries = ["/onboarding"] }: SandboxProps) {
  return (
    <OnboardingSandbox scenario={scenario} initialEntries={initialEntries} step={step}>
      <Route path="/onboarding" element={<OnboardingPage />} />
    </OnboardingSandbox>
  );
}

export const StepWelcome: Story = {
  name: "Step 0 · Welcome",
  render: () => renderOnboarding({ scenario: readyScenario, step: 0 }),
  parameters: {
    docs: {
      description: {
        story: "Intro hero and first CTA — no subscription assumptions yet.",
      },
    },
  },
};

export const StepInstallApp: Story = {
  name: "Step 1 · Install AmneziaVPN",
  render: () => renderOnboarding({ scenario: readyScenario, step: 1 }),
  parameters: {
    docs: {
      description: {
        story: "Client install guidance and store/deep-link copy.",
      },
    },
  },
};

export const StepChoosePlan: Story = {
  name: "Step 2 · Choose plan (no subscription)",
  render: () => renderOnboarding({ scenario: noPlanScenario, step: 2 }),
  parameters: {
    docs: {
      description: {
        story: "User has **no plan** — onboarding surfaces catalog / CTA toward purchase.",
      },
    },
  },
};

export const StepAddFirstDevice: Story = {
  name: "Step 2 · Add first device (has plan)",
  render: () => renderOnboarding({ scenario: emptyDevicesScenario, step: 2 }),
  parameters: {
    docs: {
      description: {
        story: "Subscribed but **no devices** — issuance / setup instructions in onboarding skin.",
      },
    },
  },
};

export const StepOpenVpn: Story = {
  name: "Step 3 · Open VPN app",
  render: () => renderOnboarding({ scenario: readyScenario, step: 3 }),
  parameters: {
    docs: {
      description: {
        story: "Connect-out — deep link and reminder to open AmneziaVPN.",
      },
    },
  },
};

export const StepConfirmConnection: Story = {
  name: "Step 4 · Confirm connection",
  render: () => renderOnboarding({ scenario: readyScenario, step: 4 }),
  parameters: {
    docs: {
      description: {
        story: "Handshake confirmation — ties into connect-status semantics after success.",
      },
    },
  },
};

export const ViewportNarrowWelcome: Story = {
  name: "Viewport · narrow (welcome)",
  render: () => renderOnboarding({ scenario: readyScenario, step: 0 }),
  parameters: {
    ...VIEW_NARROW,
    docs: {
      description: {
        story: "320px — stepper and hero density on smallest phone preset.",
      },
    },
  },
};
