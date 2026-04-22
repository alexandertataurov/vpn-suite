import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { OnboardingPage } from "@/features/onboarding/OnboardingPage";
import {
  type MockScenario,
  emptyDevicesScenario,
  noPlanScenario,
  OnboardingSandbox,
  pageStoryParameters,
  readyScenario,
} from "@/storybook/page-contracts";

const DOC_BODY = [
  "**Onboarding** (`/onboarding`) is the guided two-app flow: get access, install if needed, import the config, connect in AmneziaVPN, and confirm setup.",
  "Matches `AppRoutes`: `/onboarding` with `OnboardingPage` whenever bootstrap `phase !== \"app_ready\"` (the sandbox forces `phase: \"onboarding\"`).",
  "`OnboardingSandbox` sets `initialEntries: ['/onboarding']` and syncs bootstrap `onboardingStep` to the `step` prop so every story is a stable visual slice.",
  "Use these stories alongside **Home** and **Devices** to validate the handoff after onboarding completes.",
].join("\n\n");

const VIEW_NARROW = { viewport: { defaultViewport: "mobile390" as const } };

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
        story: "Intro hero and first CTA — explains the two-app model before any plan decision.",
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
        story: "Install guidance and store/deep-link copy for users who do not have the native app yet.",
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
        story: "User has **no plan** — onboarding surfaces the purchase path before device setup.",
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
        story: "Subscribed but **no devices** — onboarding moves into device guidance instead of re-explaining payment.",
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
        story: "Connect-out — deep link and reminder to open AmneziaVPN for the actual VPN connection.",
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
        story: "Handshake confirmation — ties into connect-status semantics after the import completes.",
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

export const ViewportNarrowChoosePlan: Story = {
  name: "Viewport · narrow (choose plan)",
  render: () => renderOnboarding({ scenario: noPlanScenario, step: 2 }),
  parameters: {
    ...VIEW_NARROW,
    docs: {
      description: {
        story: "320px — catalog / plan CTAs at step 2 with **no subscription** (`noPlanScenario`).",
      },
    },
  },
};

export const InteractiveInstallReady: Story = {
  name: "Interactive · install ready",
  render: () => renderOnboarding({ scenario: readyScenario, step: 1 }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Already installed? Continue" }));
    await waitFor(() => {
      expect(canvas.getByRole("button", { name: "Continue setup" })).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Exercises the install step's ready-state transition after the user confirms the app is already installed.",
      },
    },
  },
};
