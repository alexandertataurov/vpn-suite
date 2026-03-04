import type { Meta, StoryObj } from "@storybook/react";
import { MetricCell } from "./MetricCell";

const meta: Meta<typeof MetricCell> = {
  title: "Shared/Primitives/MetricCell",
  component: MetricCell,
  parameters: {
    docs: {
      description: {
        component: `Numeric table cell with right alignment and tabular numbers.

**Use:** Metrics, currency, counts.
**Avoid:** Non-numeric text.

**Tokens:** --text-body, --font-mono, --spacing-2/3.
**Accessibility:** Provide headers with scope or aria-labels.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof MetricCell>;

export const MetricCellOverview: Story = {
  render: () => (
    <table className="ds-table" aria-label="Metric cell example">
      <thead>
        <tr>
          <th>Name</th>
          <th className="table-cell-align-right">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Active peers</td>
          <MetricCell>12,345</MetricCell>
        </tr>
      </tbody>
    </table>
  ),
};

export const MetricCellVariants: Story = {
  render: () => (
    <table className="ds-table" aria-label="Metric cell variants">
      <thead>
        <tr>
          <th>Label</th>
          <th className="table-cell-align-right">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Mono default</td>
          <MetricCell>1234.56</MetricCell>
        </tr>
        <tr>
          <td>Mono off</td>
          <MetricCell mono={false}>1234.56</MetricCell>
        </tr>
      </tbody>
    </table>
  ),
};

export const MetricCellSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses table typography tokens.</p>
      <table className="ds-table" aria-label="Metric cell sizes">
        <tbody>
          <tr>
            <td>Default</td>
            <MetricCell>1234.56</MetricCell>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};

export const MetricCellStates: Story = {
  render: () => (
    <table className="ds-table" aria-label="Metric cell states">
      <tbody>
        <tr>
          <td>Default</td>
          <MetricCell>1234.56</MetricCell>
        </tr>
      </tbody>
    </table>
  ),
};

export const MetricCellWithLongText: Story = {
  render: () => (
    <table className="ds-table" aria-label="Metric cell long text">
      <tbody>
        <tr>
          <td>Long metric label</td>
          <MetricCell>1234567890.123456</MetricCell>
        </tr>
      </tbody>
    </table>
  ),
};

export const MetricCellAccessibility: Story = {
  render: () => (
    <table className="ds-table" aria-label="Metric cell accessible">
      <thead>
        <tr>
          <th scope="col">Metric</th>
          <th scope="col" className="table-cell-align-right">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Active peers</td>
          <MetricCell>12,345</MetricCell>
        </tr>
      </tbody>
    </table>
  ),
};

export const MetricCellDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <table className="ds-table" aria-label="Metric cell dark">
      <tbody>
        <tr>
          <td>RX</td>
          <MetricCell>1.2 GB</MetricCell>
        </tr>
      </tbody>
    </table>
  ),
};

export const MetricCellEdgeCases = WithLongText;
