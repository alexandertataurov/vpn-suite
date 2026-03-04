import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Tabs } from "./Tabs";

const items = [
  { id: "tab1", label: "Tab 1" },
  { id: "tab2", label: "Tab 2" },
  { id: "tab3", label: "Tab 3", disabled: true },
];

const meta: Meta<typeof Tabs> = {
  title: "Shared/Primitives/Tabs",
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component: "Tab navigation. Controlled via value/onChange. Keyboard: arrow keys.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Tabs>;

function TabsDemo() {
  const [value, setValue] = useState("tab1");
  return <Tabs items={items} value={value} onChange={setValue} ariaLabel="Demo tabs" />;
}

export const TabsOverview: Story = {
  render: () => <TabsDemo />,
};

export const TabsVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <Tabs items={items} value="tab1" onChange={() => {}} ariaLabel="Default tabs" />
      <Tabs items={items} value="tab1" onChange={() => {}} ariaLabel="Small tabs" size="sm" />
    </div>
  ),
};

export const TabsSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <Tabs items={items} value="tab1" onChange={() => {}} ariaLabel="Small tabs" size="sm" />
      <Tabs items={items} value="tab1" onChange={() => {}} ariaLabel="Medium tabs" size="md" />
    </div>
  ),
};

export const TabsStates: Story = {
  render: () => <Tabs items={items} value="tab1" onChange={() => {}} ariaLabel="Tabs with disabled" />,
};

export const TabsWithLongText: Story = {
  render: () => (
    <Tabs
      items={[
        { id: "long", label: "Very long tab label that should wrap or truncate" },
        { id: "short", label: "Short" },
      ]}
      value="long"
      onChange={() => {}}
      ariaLabel="Long labels"
    />
  ),
};

export const TabsAccessibility: Story = {
  render: () => <Tabs items={items} value="tab2" onChange={() => {}} ariaLabel="Keyboard navigable tabs" />,
};

export const TabsDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => <TabsDemo />,
};

export const TabsEdgeCases = WithLongText;
