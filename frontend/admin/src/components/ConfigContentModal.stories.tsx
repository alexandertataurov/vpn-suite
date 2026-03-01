import { useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ConfigContentModal } from "./overlays/ConfigContentModal";
import { api } from "../api/client";

const meta: Meta<typeof ConfigContentModal> = {
  title: "Components/Modal/ConfigContentModal",
  component: ConfigContentModal,
};

export default meta;

type Story = StoryObj<typeof ConfigContentModal>;

const mockContent = `[Interface]\nPrivateKey = <redacted>\nAddress = 10.0.0.2/32\n\n[Peer]\nPublicKey = <server>\nEndpoint = 203.0.113.1:51820`;

function ApiMock({ mode, children }: { mode: "success" | "error"; children: React.ReactNode }) {
  useEffect(() => {
    const originalGet = api.get;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- mock signature
    api.get = async <T,>(_path: string, _init?: RequestInit): Promise<T> => {
      if (mode === "error") throw new Error("Failed to load config");
      return { content: mockContent } as T;
    };
    return () => {
      api.get = originalGet;
    };
  }, [mode]);
  return <>{children}</>;
}

export const Overview: Story = {
  render: () => (
    <ApiMock mode="success">
      <ConfigContentModal open onClose={() => {}} issuedConfigId="cfg-123" label="edge-01" />
    </ApiMock>
  ),
};

export const Variants: Story = {
  render: () => (
    <ApiMock mode="error">
      <ConfigContentModal open onClose={() => {}} issuedConfigId="cfg-404" label="edge-02" />
    </ApiMock>
  ),
};

export const Sizes: Story = {
  render: () => (
    <ApiMock mode="success">
      <ConfigContentModal open onClose={() => {}} issuedConfigId="cfg-123" label="edge-01" />
    </ApiMock>
  ),
};

export const States: Story = {
  render: () => (
    <ApiMock mode="success">
      <ConfigContentModal open onClose={() => {}} issuedConfigId="cfg-123" label="edge-01" />
    </ApiMock>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <ApiMock mode="success">
      <ConfigContentModal open onClose={() => {}} issuedConfigId="cfg-123" label="core-edge-primary-02-us-east-1" />
    </ApiMock>
  ),
};

export const EdgeCases = WithLongText;

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <ApiMock mode="success">
      <ConfigContentModal open onClose={() => {}} issuedConfigId="cfg-123" label="edge-01" />
    </ApiMock>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <ApiMock mode="success">
      <ConfigContentModal open onClose={() => {}} issuedConfigId="cfg-123" label="edge-01" />
    </ApiMock>
  ),
};
