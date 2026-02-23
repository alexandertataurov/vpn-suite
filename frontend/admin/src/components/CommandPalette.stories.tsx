import type { Meta, StoryObj } from "@storybook/react";
import { CommandPalette } from "./CommandPalette";

const meta: Meta<typeof CommandPalette> = {
  title: "Components/CommandPalette",
  component: CommandPalette,
};

export default meta;

type Story = StoryObj<typeof CommandPalette>;

const items = [
  { id: "servers", label: "Go to Servers", keywords: "servers list", onSelect: () => {} },
  { id: "telemetry", label: "Open Telemetry", keywords: "charts", onSelect: () => {} },
  { id: "settings", label: "Settings", keywords: "preferences", onSelect: () => {} },
];

export const Overview: Story = {
  render: () => <CommandPalette open onClose={() => {}} items={items} />,
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <CommandPalette open onClose={() => {}} items={items} />
      <CommandPalette open onClose={() => {}} items={[]} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Command palette sizing is tokenized.</p>
      <CommandPalette open onClose={() => {}} items={items} />
    </div>
  ),
};

export const States: Story = {
  render: () => <CommandPalette open onClose={() => {}} items={items} />,
};

export const WithLongText: Story = {
  render: () => (
    <CommandPalette
      open
      onClose={() => {}}
      items={[
        { id: "long", label: "Open server core-edge-primary-02-us-east-1", keywords: "server long", onSelect: () => {} },
      ]}
    />
  ),
};

export const EdgeCases = WithLongText;

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => <CommandPalette open onClose={() => {}} items={items} />,
};

export const Accessibility: Story = {
  render: () => <CommandPalette open onClose={() => {}} items={items} />,
};
