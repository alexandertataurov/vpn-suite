import type { Meta, StoryObj } from "@storybook/react";
import { SupportDiagnosticsCard } from "@/design-system/recipes";

const meta: Meta<typeof SupportDiagnosticsCard> = {
  title: "Recipes/Support/SupportDiagnosticsCard",
  tags: ["autodocs"],
  component: SupportDiagnosticsCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Support handoff card that summarizes the user's current app state and offers a copy/contact flow before escalation.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    eyebrow: "Contact support",
    title: "Diagnostics",
    subtitle: "Use this summary when you contact support so they can help faster.",
    stats: [
      { label: "Subscription", value: "active · Mar 24, 2026" },
      { label: "Devices", value: "2 / 3" },
      { label: "Current screen", value: "/support" },
      { label: "Last action", value: "support_opened" },
      { label: "App", value: "1.2.3 (release)" },
      { label: "Platform", value: "ios" },
      { label: "Language", value: "en" },
    ],
    copyLabel: "Copy diagnostics",
    contactLabel: "Contact support",
    onCopy: () => {},
    onContactSupport: () => {},
  },
};
