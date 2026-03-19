import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { expect, userEvent, within } from "storybook/test";
import { SupportPage } from "@/pages/Support";
import {
  failureScenario,
  loadingSessionScenario,
  loggedOutScenario,
  PageSandbox,
  readyScenario,
} from "@/storybook/page-contracts";

const pageStoryParameters = {
  layout: "fullscreen" as const,
  viewport: { defaultViewport: "iphone14" },
  status: { type: "stable" as const },
};

const meta: Meta = {
  title: "Pages/Contracts/Support",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component: "Support route with support status, quick paths, the troubleshooting flow, and the FAQ list from the miniapp.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const HelpCenter: Story = {
  name: "Help center",
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/support"]}>
      <Route path="/support" element={<SupportPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Full support page with contact status, quick paths, troubleshooting steps, and FAQ.",
      },
    },
  },
};

export const Loading: Story = {
  name: "Support loading",
  render: () => (
    <PageSandbox scenario={loadingSessionScenario} initialEntries={["/support"]}>
      <Route path="/support" element={<SupportPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Skeleton state while support page data and session state load.",
      },
    },
  },
};

export const Error: Story = {
  name: "Could not load support",
  render: () => (
    <PageSandbox scenario={failureScenario} initialEntries={["/support"]}>
      <Route path="/support" element={<SupportPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Fallback error state when the support route cannot load.",
      },
    },
  },
};

export const SessionMissing: Story = {
  name: "Session missing",
  render: () => (
    <PageSandbox scenario={loggedOutScenario} initialEntries={["/support"]}>
      <Route path="/support" element={<SupportPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "No active miniapp session. The route resolves to the session-missing state.",
      },
    },
  },
};

export const FaqExpanded: Story = {
  name: "FAQ expanded",
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/support"]}>
      <Route path="/support" element={<SupportPage />} />
    </PageSandbox>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const faqButton = await canvas.findByRole("button", { name: "VPN not connecting" });
    await userEvent.click(faqButton);
    await expect(faqButton).toHaveAttribute("aria-expanded", "true");
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive: expand the VPN not connecting FAQ item inside the actual Support route.",
      },
    },
  },
};
