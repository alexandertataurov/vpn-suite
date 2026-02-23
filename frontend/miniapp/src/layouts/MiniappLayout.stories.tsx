import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { MiniappLayout } from "./MiniappLayout";

const meta: Meta<typeof MiniappLayout> = {
  title: "Pages/Miniapp/Overview",
  component: MiniappLayout,
  parameters: {
    router: { disabled: true },
    docs: {
      description: {
        component: "Miniapp layout with bottom nav. Routes: status, devices, profile, help.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof MiniappLayout>;

export const Overview: Story = {
  render: () => (
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<MiniappLayout />}>
          <Route index element={<p>Status content</p>} />
          <Route path="devices" element={<p>Devices content</p>} />
          <Route path="profile" element={<p>Profile content</p>} />
          <Route path="help" element={<p>Help content</p>} />
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
          <Route index element={<p>Status content</p>} />
          <Route path="devices" element={<p>Devices content</p>} />
          <Route path="profile" element={<p>Profile content</p>} />
          <Route path="help" element={<p>Help content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Reference layout only; size variants are not exposed.</p>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<MiniappLayout />}>
            <Route index element={<p>Status content</p>} />
            <Route path="devices" element={<p>Devices content</p>} />
            <Route path="profile" element={<p>Profile content</p>} />
            <Route path="help" element={<p>Help content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <MemoryRouter initialEntries={["/profile"]}>
      <Routes>
        <Route path="/" element={<MiniappLayout />}>
          <Route index element={<p>Status content</p>} />
          <Route path="devices" element={<p>Devices content</p>} />
          <Route path="profile" element={<p>Profile content</p>} />
          <Route path="help" element={<p>Help content</p>} />
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
          <Route index element={<p>Long status content that should wrap and remain readable in the miniapp layout.</p>} />
          <Route path="devices" element={<p>Devices content</p>} />
          <Route path="profile" element={<p>Profile content</p>} />
          <Route path="help" element={<p>Help content</p>} />
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
          <Route index element={<p>Status content</p>} />
          <Route path="devices" element={<p>Devices content</p>} />
          <Route path="profile" element={<p>Profile content</p>} />
          <Route path="help" element={<p>Help content</p>} />
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
          <Route index element={<p>Status content</p>} />
          <Route path="devices" element={<p>Devices content</p>} />
          <Route path="profile" element={<p>Profile content</p>} />
          <Route path="help" element={<p>Help content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};

export const EdgeCases = WithLongText;
