import type { Meta, StoryObj } from "@storybook/react";
import { RenewalBanner } from "./RenewalBanner";

const meta = {
  title: "Patterns/RenewalBanner",
  tags: ["autodocs"],
  component: RenewalBanner,
  parameters: {
    docs: { description: { component: "Renewal banner per amnezia spec §4.4. Expiring or expired subscription prompt." } },
  },
  argTypes: {
    variant: { control: "select", options: ["expiring", "expired"] },
  },
} satisfies Meta<typeof RenewalBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Expiring: Story = {
  args: {
    variant: "expiring",
    title: "Subscription expires in 14 days",
    subtitle: "Renew now to keep your plan active.",
    onClick: () => {},
  },
};

export const Expired: Story = {
  args: {
    variant: "expired",
    title: "Subscription expired",
    subtitle: "Renew to restore access.",
    onClick: () => {},
  },
};
