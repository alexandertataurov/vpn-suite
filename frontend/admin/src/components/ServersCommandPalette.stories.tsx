import type { Meta, StoryObj } from "@storybook/react";
import { ServersCommandPalette } from "./ServersCommandPalette";

const meta: Meta<typeof ServersCommandPalette> = {
  title: "Components/CommandPalette/ServersCommandPalette",
  component: ServersCommandPalette,
};

export default meta;

type Story = StoryObj<typeof ServersCommandPalette>;

const groups = [
  {
    heading: "Servers",
    items: [
      { id: "srv-1", label: "core-edge-primary-01", keywords: "us-east-1", onSelect: () => {} },
      { id: "srv-2", label: "core-edge-primary-02", keywords: "eu-west-1", onSelect: () => {} },
    ],
  },
  {
    heading: "Actions",
    items: [
      { id: "sync", label: "Sync all servers", onSelect: () => {} },
      { id: "export", label: "Export list", onSelect: () => {} },
    ],
  },
];

export const Overview: Story = {
  render: () => <ServersCommandPalette open onClose={() => {}} groups={groups} />,
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <ServersCommandPalette open onClose={() => {}} groups={groups} />
      <ServersCommandPalette open onClose={() => {}} groups={[]} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Sizing is tokenized via command palette styles.</p>
      <ServersCommandPalette open onClose={() => {}} groups={groups} />
    </div>
  ),
};

export const States: Story = {
  render: () => <ServersCommandPalette open onClose={() => {}} groups={groups} />,
};

export const WithLongText: Story = {
  render: () => (
    <ServersCommandPalette
      open
      onClose={() => {}}
      groups={[
        {
          heading: "Servers",
          items: [
            {
              id: "srv-long",
              label: "core-edge-primary-02-us-east-1-maintenance-window",
              keywords: "long name",
              onSelect: () => {},
            },
          ],
        },
      ]}
    />
  ),
};

export const EdgeCases = WithLongText;

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => <ServersCommandPalette open onClose={() => {}} groups={groups} />,
};

export const Accessibility: Story = {
  render: () => <ServersCommandPalette open onClose={() => {}} groups={groups} />,
};
