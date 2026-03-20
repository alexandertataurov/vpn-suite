import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { expect, userEvent, waitFor, within } from "storybook/test";
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

/** Session OK but `/webapp/support/faq` fails — page stays ready with FAQ fallback + offline banner (`faqOffline`). */
const supportFaqEndpointErrorScenario = {
  ...readyScenario,
  statuses: { supportFaq: 500 },
} satisfies MockScenario;

const DOC_BODY = [
  "**Support** (`/support`) combines the contact card, quick paths, stepped troubleshooter, and FAQ disclosures into one reviewable contract.",
  "**States** cover ready, `me` + `access` loading, `me` error, logged out, and the inline FAQ endpoint failure (`supportFaq` 500).",
  "FAQ button text matches **`support.faq_item_connection_title`** (EN: **VPN not connecting**). The troubleshooter primary action on step 1 is **`support.troubleshooter_step_access_next`** (EN: **Access is active**).",
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

export const FaqEndpointOffline: Story = {
  name: "FAQ endpoint offline",
  render: () => renderSupport(supportFaqEndpointErrorScenario),
  parameters: {
    docs: {
      description: {
        story:
          "`GET /webapp/support/faq` returns 500 while `me` succeeds — UI keeps FAQ items from static keys and shows the offline warning (`support.faq_offline_*`).",
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
        story:
          "Toggles the first FAQ row; the visible question is **`support.faq_item_connection_title`** (EN **VPN not connecting**). Asserts `aria-expanded=\"true\"` after click.",
      },
    },
  },
};

export const InteractiveTroubleshooterNextStep: Story = {
  name: "Interactive · troubleshooter next step",
  render: () => renderSupport(readyScenario),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { level: 3, name: "Check access status" });
    const next = await canvas.findByRole("button", { name: "Access is active" });
    await userEvent.click(next);
    await waitFor(() => {
      expect(
        canvas.getByRole("heading", { level: 3, name: "Check device config" }),
      ).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          "From step 1, presses the primary **Access is active** control (`support.troubleshooter_step_access_next`) and expects the step-2 title **Check device config** (`support.troubleshooter_step_device_title`) as an `h3`.",
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
