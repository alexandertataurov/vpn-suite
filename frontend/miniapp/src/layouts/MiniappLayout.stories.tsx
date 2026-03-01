import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { MiniappLayout } from "./MiniappLayout";
import { Body } from "../ui";

const meta: Meta<typeof MiniappLayout> = {
  title: "Pages/Miniapp/Overview",
  component: MiniappLayout,
  parameters: {
    router: { disabled: true },
    docs: {
      description: {
        component: "Miniapp tabbed shell with bottom nav. Routes: home, devices, plan, support, settings.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof MiniappLayout>;

function StoryText({ text }: { text: string }) {
  return <Body>{text}</Body>;
}

export const Overview: Story = {
  render: () => (
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<MiniappLayout />}>
          <Route index element={<StoryText text="Home content" />} />
          <Route path="devices" element={<StoryText text="Devices content" />} />
          <Route path="plan" element={<StoryText text="Plan content" />} />
          <Route path="support" element={<StoryText text="Support content" />} />
          <Route path="settings" element={<StoryText text="Settings content" />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};

export const Variants: Story = {
  render: () => (
    <MemoryRouter initialEntries={["/devices"]}>
      <Routes>
        <Route path="/" element={<MiniappLayout />}>
          <Route index element={<StoryText text="Home content" />} />
          <Route path="devices" element={<StoryText text="Devices content" />} />
          <Route path="plan" element={<StoryText text="Plan content" />} />
          <Route path="support" element={<StoryText text="Support content" />} />
          <Route path="settings" element={<StoryText text="Settings content" />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <Body>Reference layout only; size variants are not exposed.</Body>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<MiniappLayout />}>
            <Route index element={<StoryText text="Home content" />} />
            <Route path="devices" element={<StoryText text="Devices content" />} />
            <Route path="plan" element={<StoryText text="Plan content" />} />
            <Route path="support" element={<StoryText text="Support content" />} />
            <Route path="settings" element={<StoryText text="Settings content" />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <MemoryRouter initialEntries={["/support"]}>
      <Routes>
        <Route path="/" element={<MiniappLayout />}>
          <Route index element={<StoryText text="Home content" />} />
          <Route path="devices" element={<StoryText text="Devices content" />} />
          <Route path="plan" element={<StoryText text="Plan content" />} />
          <Route path="support" element={<StoryText text="Support content" />} />
          <Route path="settings" element={<StoryText text="Settings content" />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<MiniappLayout />}>
          <Route
            index
            element={<StoryText text="Long home content that should wrap and remain readable in the miniapp shell." />}
          />
          <Route path="devices" element={<StoryText text="Devices content" />} />
          <Route path="plan" element={<StoryText text="Plan content" />} />
          <Route path="support" element={<StoryText text="Support content" />} />
          <Route path="settings" element={<StoryText text="Settings content" />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<MiniappLayout />}>
          <Route index element={<StoryText text="Home content" />} />
          <Route path="devices" element={<StoryText text="Devices content" />} />
          <Route path="plan" element={<StoryText text="Plan content" />} />
          <Route path="support" element={<StoryText text="Support content" />} />
          <Route path="settings" element={<StoryText text="Settings content" />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<MiniappLayout />}>
          <Route index element={<StoryText text="Home content" />} />
          <Route path="devices" element={<StoryText text="Devices content" />} />
          <Route path="plan" element={<StoryText text="Plan content" />} />
          <Route path="support" element={<StoryText text="Support content" />} />
          <Route path="settings" element={<StoryText text="Settings content" />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};

export const EdgeCases = WithLongText;
