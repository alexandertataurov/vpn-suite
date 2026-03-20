import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { expect, userEvent, within } from "storybook/test";
import { SupportPage } from "@/pages/Support";
import {
  type MockScenario,
  failureScenario,
  loadingSessionScenario,
  loggedOutScenario,
  PageSandbox,
  pageStoryParameters,
  readyScenario,
} from "@/storybook/page-contracts";

const DOC_BODY = [
  "**Support** (`/support`): contact status, quick links, troubleshooter, and FAQ accordion.",
  "Mocks come from `page-contracts` (`supportFaq`, session, etc.) inside **PageSandbox**.",
  "FAQ interaction story asserts `aria-expanded` after toggle for a11y regression.",
].join("\n\n");

const VIEW_NARROW = { viewport: { defaultViewport: "iphoneSE" as const } };
const VIEW_WIDE = { viewport: { defaultViewport: "adminDesktop" as const } };

const meta = {
  title: "Pages/Contracts/Support",
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

function renderSupport(scenario: MockScenario) {
  return (
    <PageSandbox scenario={scenario} initialEntries={["/support"]}>
      <Route path="/support" element={<SupportPage />} />
    </PageSandbox>
  );
}

export const HelpCenter: Story = {
  name: "Help center",
  render: () => renderSupport(readyScenario),
  parameters: {
    docs: {
      description: {
        story: "Full page: hero, quick paths, troubleshooter card, FAQ list.",
      },
    },
  },
};

export const Loading: Story = {
  name: "Support loading",
  render: () => renderSupport(loadingSessionScenario),
  parameters: {
    docs: {
      description: {
        story: "Skeletons while FAQ and user/session endpoints resolve.",
      },
    },
  },
};

export const LoadError: Story = {
  name: "Could not load support",
  render: () => renderSupport(failureScenario),
  parameters: {
    docs: {
      description: {
        story: "Error surface with retry for failed bootstrap.",
      },
    },
  },
};

export const SessionMissing: Story = {
  name: "Session missing",
  render: () => renderSupport(loggedOutScenario),
  parameters: {
    docs: {
      description: {
        story: "Logged-out / no token — `SessionMissing` path.",
      },
    },
  },
};

export const InteractiveFaqExpand: Story = {
  name: "Interactive · FAQ expanded",
  render: () => renderSupport(readyScenario),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const faqButton = await canvas.findByRole("button", { name: "VPN not connecting" });
    await userEvent.click(faqButton);
    await expect(faqButton).toHaveAttribute("aria-expanded", "true");
  },
  parameters: {
    docs: {
      description: {
        story: "Opens a disclosure and verifies expanded state for screen readers.",
      },
    },
  },
};

export const ViewportNarrow: Story = {
  name: "Viewport · narrow",
  render: () => renderSupport(readyScenario),
  parameters: {
    ...VIEW_NARROW,
    docs: {
      description: {
        story: "320px — accordion hit targets and stacked sections.",
      },
    },
  },
};

export const ViewportWide: Story = {
  name: "Viewport · wide",
  render: () => renderSupport(readyScenario),
  parameters: {
    ...VIEW_WIDE,
    docs: {
      description: {
        story: "Wide canvas — content max-width and section rhythm.",
      },
    },
  },
};
