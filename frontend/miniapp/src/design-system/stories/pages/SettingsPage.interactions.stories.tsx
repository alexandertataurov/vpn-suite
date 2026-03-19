import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { SettingsPage } from "@/pages/Settings";
import {
  PageSandbox,
  pageStoryParameters,
  readyScenario,
} from "@/storybook/page-contracts";

const meta: Meta = {
  title: "Pages/Contracts/Settings Interactions",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component:
          "Interactive and responsive coverage for the Settings page, kept separate from the route-state matrix.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const ProfileModalOpen: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/settings?modal=profile"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Profile edit modal opened via URL param.",
      },
    },
  },
};

export const MobileNarrow: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  parameters: {
    viewport: { defaultViewport: "iphoneSE" },
    docs: {
      description: {
        story: "320px viewport. Smallest supported mobile.",
      },
    },
  },
};

export const Tablet: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  parameters: {
    viewport: { defaultViewport: "adminDesktop" },
    docs: {
      description: {
        story: "Desktop/tablet viewport. Stack layout adapts.",
      },
    },
  },
};

export const OpenProfileModal: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previewDocument = canvasElement.ownerDocument;
    const editProfileLabel = await canvas.findByText("Edit profile");
    const editProfile = editProfileLabel.closest('[role="button"]');
    if (!editProfile) {
      throw new Error('Could not find button container for "Edit profile".');
    }
    await userEvent.click(editProfile);
    await waitFor(() => {
      expect(previewDocument.querySelector('[role="dialog"]')).not.toBeNull();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive: tap the "Edit profile" row and verify the profile dialog opens.',
      },
    },
  },
};

export const OpenLanguageMenu: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previewDocument = canvasElement.ownerDocument;
    const languageLabel = await canvas.findByText("Language");
    const languageRow = languageLabel.closest('[role="button"]');
    if (!languageRow) {
      throw new Error('Could not find button container for "Language".');
    }
    await userEvent.click(languageRow);
    await waitFor(() => {
      expect(previewDocument.querySelector('[role="menu"]')).not.toBeNull();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive: tap the "Language" row and verify the locale menu opens.',
      },
    },
  },
};

export const OpenCancelFlow: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previewDocument = canvasElement.ownerDocument;
    const cancelPlanLabel = await canvas.findByText("Cancel plan");
    const cancelPlan = cancelPlanLabel.closest('[role="button"]');
    if (!cancelPlan) {
      throw new Error('Could not find button container for "Cancel plan".');
    }
    await userEvent.click(cancelPlan);
    await waitFor(() => {
      expect(previewDocument.querySelector('[role="dialog"]')).not.toBeNull();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive: tap the "Cancel plan" row and verify the cancellation flow opens.',
      },
    },
  },
};
