import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TimeRangePicker } from "./chrome/TimeRangePicker";

const meta: Meta<typeof TimeRangePicker> = {
  title: "Components/FilterBar/TimeRangePicker",
  component: TimeRangePicker,
};

export default meta;

type Story = StoryObj<typeof TimeRangePicker>;

const options = [
  { value: "1h", label: "Last 1 hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
];

function Demo() {
  const [value, setValue] = useState("1h");
  return <TimeRangePicker value={value} onChange={setValue} options={options} />;
}

export const Overview: Story = {
  render: () => <Demo />,
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <TimeRangePicker value="1h" onChange={() => {}} options={options} />
      <TimeRangePicker value="7d" onChange={() => {}} options={options} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size is tokenized via Select input.</p>
      <Demo />
    </div>
  ),
};

export const States: Story = {
  render: () => <Demo />,
};

export const WithLongText: Story = {
  render: () => (
    <div className="max-w-200">
      <TimeRangePicker
        value="24h"
        onChange={() => {}}
        options={[
          { value: "custom", label: "Custom range with a very long label" },
          ...options,
        ]}
      />
    </div>
  ),
};

export const EdgeCases = WithLongText;

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => <Demo />,
};

export const Accessibility: Story = {
  render: () => <TimeRangePicker value="1h" onChange={() => {}} options={options} aria-label="Time range" />,
};
