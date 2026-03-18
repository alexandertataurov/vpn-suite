import type { Meta, StoryObj } from "@storybook/react";
import { NewUserHero } from "./NewUserHero";
import { Button } from "@/design-system";

const meta = {
  title: "Patterns/NewUserHero",
  tags: ["autodocs"],
  component: NewUserHero,
  parameters: {
    docs: { description: { component: "New-user hero per amnezia spec §4.10. Centered card when no plan purchased." } },
  },
} satisfies Meta<typeof NewUserHero>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Setup Required",
    description: "Choose a plan to start using AmneziaVPN with secure access on your devices.",
    primaryAction: <Button variant="primary">Choose a Plan</Button>,
    secondaryAction: <Button variant="secondary">Learn more</Button>,
  },
};

export const PrimaryOnly: Story = {
  args: {
    title: "Setup Required",
    description: "Choose a plan to get started.",
    primaryAction: <Button variant="primary">Choose a Plan</Button>,
  },
};
