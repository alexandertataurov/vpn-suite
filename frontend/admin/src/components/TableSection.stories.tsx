import type { Meta, StoryObj } from "@storybook/react";
import { TableSection } from "./TableSection";
import { Button } from "@vpn-suite/shared/ui";

const meta: Meta<typeof TableSection> = {
  title: "Components/TableSection",
  component: TableSection,
};

export default meta;

type Story = StoryObj<typeof TableSection>;

const SimpleTable = () => (
  <table className="ds-table">
    <thead>
      <tr>
        <th>Name</th>
        <th className="text-right">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>core-edge-primary-01</td>
        <td className="text-right">Online</td>
      </tr>
      <tr>
        <td>core-edge-primary-02</td>
        <td className="text-right">Degraded</td>
      </tr>
    </tbody>
  </table>
);

export const Overview: Story = {
  render: () => (
    <TableSection title="Servers" actions={<Button variant="secondary" size="sm">Add</Button>}>
      <SimpleTable />
    </TableSection>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <TableSection title="With pagination" pagination={{ offset: 0, limit: 25, total: 240, onPage: () => {} }}>
        <SimpleTable />
      </TableSection>
      <TableSection title="No header">
        <SimpleTable />
      </TableSection>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Sizing is tokenized via Panel and table styles.</p>
      <TableSection title="Servers">
        <SimpleTable />
      </TableSection>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <TableSection title="Default">
      <SimpleTable />
    </TableSection>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <TableSection title="Server list for core-edge-primary-02-us-east-1"
      actions={<Button variant="ghost" size="sm">Export</Button>}
    >
      <SimpleTable />
    </TableSection>
  ),
};

export const EdgeCases = WithLongText;

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <TableSection title="Servers">
      <SimpleTable />
    </TableSection>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <TableSection title="Accessible table">
      <SimpleTable />
    </TableSection>
  ),
};
