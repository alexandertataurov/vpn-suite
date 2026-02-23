import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@vpn-suite/shared/ui";
import { SectionHeader } from "./SectionHeader";

const meta: Meta<typeof SectionHeader> = {
  title: "Components/SectionHeader",
  component: SectionHeader,
};

export default meta;

type Story = StoryObj<typeof SectionHeader>;

export const Overview: Story = {
  args: { title: "Section title", description: "Optional description" },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <SectionHeader title="Title only" />
      <SectionHeader title="With description" description="Short helper text" />
      <SectionHeader title="With actions" actions={<Button variant="secondary" size="sm">Action</Button>} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">SectionHeader uses tokenized text sizes.</p>
      <SectionHeader title="Section title" description="Tokenized type" />
    </div>
  ),
};

export const States: Story = {
  render: () => <SectionHeader title="Default" description="Default state" />,
};

export const WithLongText: Story = {
  render: () => (
    <SectionHeader
      title="Server details for core-edge-primary-02-us-east-1"
      description="Long description that should wrap without breaking layout"
      actions={<Button variant="ghost" size="sm">Action</Button>}
    />
  ),
};

export const EdgeCases = WithLongText;

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { title: "Section title", description: "Dark mode" },
};

export const Accessibility: Story = {
  args: { title: "Accessible section", description: "Use headings for structure" },
};
