import type { Meta, StoryObj } from "@storybook/react";
import { HelpPage } from "./Help";
import { MiniappFrame } from "../storybook/wrappers";

const meta: Meta<typeof HelpPage> = {
  title: "Pages/Miniapp/Help",
  component: HelpPage,
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: "Miniapp Help reference layout." } },
  },
};

export default meta;

type Story = StoryObj<typeof HelpPage>;

const renderPage = () => (
  <MiniappFrame>
    <HelpPage />
  </MiniappFrame>
);

export const Overview: Story = { render: renderPage };

export const Variants: Story = { render: renderPage };

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Reference layout only; size variants are not exposed.</p>
      {renderPage()}
    </div>
  ),
};

export const States: Story = { render: renderPage };

export const WithLongText: Story = { render: renderPage };

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: renderPage,
};

export const Accessibility: Story = { render: renderPage };

export const EdgeCases = WithLongText;
