import { useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { IssueConfigModal } from "./IssueConfigModal";
import { api } from "../api/client";
import type { ServerOut } from "@vpn-suite/shared/types";

const meta: Meta<typeof IssueConfigModal> = {
  title: "Components/Modal/IssueConfigModal",
  component: IssueConfigModal,
};

export default meta;

type Story = StoryObj<typeof IssueConfigModal>;

const server = {
  id: "srv-123",
  name: "core-edge-primary-01",
  created_at: "2025-01-01T00:00:00.000Z",
  status: "online",
  is_active: true,
  is_draining: false,
  is_provisioning_disabled: false,
  region: "us-east-1",
  vpn_endpoint: "vpn.example.com",
  api_endpoint: "https://api.example.com",
} as ServerOut;

const mockResponse = {
  request_id: "req-123",
  peer: { id: "dev-1", server_id: "srv-123", device_name: null, public_key: "pk", issued_at: "2025-01-01T00:00:00.000Z" },
  config_awg: { download_url: "https://example.com/awg.conf", qr_payload: "[Interface]\nPrivateKey=xxx\n[Peer]\nPublicKey=yyy" },
  config_wg_obf: { download_url: "https://example.com/wg-obf.conf", qr_payload: "[Interface]\nPrivateKey=xxx\n[Peer]\nPublicKey=yyy" },
  config_wg: { download_url: "https://example.com/wg.conf", qr_payload: "[Interface]\nPrivateKey=xxx\n[Peer]\nPublicKey=yyy" },
  peer_created: true,
};

function ApiMock({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const originalPost = api.post;
    api.post = async <T,>(_path: string, _body?: unknown) => mockResponse as T;
    return () => {
      api.post = originalPost;
    };
  }, []);
  return <>{children}</>;
}

export const Overview: Story = {
  render: () => (
    <ApiMock>
      <IssueConfigModal open onClose={() => {}} server={server} />
    </ApiMock>
  ),
};

export const Variants: Story = {
  render: () => (
    <ApiMock>
      <div className="sb-stack">
        <IssueConfigModal open onClose={() => {}} server={server} />
        <IssueConfigModal open onClose={() => {}} server={null} />
      </div>
    </ApiMock>
  ),
};

export const Sizes: Story = {
  render: () => (
    <ApiMock>
      <IssueConfigModal open onClose={() => {}} server={server} />
    </ApiMock>
  ),
};

export const States: Story = {
  render: () => (
    <ApiMock>
      <IssueConfigModal open onClose={() => {}} server={server} />
    </ApiMock>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <ApiMock>
      <IssueConfigModal open onClose={() => {}} server={{ ...server, name: "core-edge-primary-02-us-east-1" }} />
    </ApiMock>
  ),
};

export const EdgeCases = WithLongText;

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <ApiMock>
      <IssueConfigModal open onClose={() => {}} server={server} />
    </ApiMock>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <ApiMock>
      <IssueConfigModal open onClose={() => {}} server={server} />
    </ApiMock>
  ),
};
