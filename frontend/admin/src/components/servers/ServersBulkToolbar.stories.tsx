import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ServersBulkToolbar } from "./ServersBulkToolbar";

const meta: Meta<typeof ServersBulkToolbar> = {
  title: "Components/FilterBar/ServersBulkToolbar",
  component: ServersBulkToolbar,
};

export default meta;

type Story = StoryObj<typeof ServersBulkToolbar>;

function Demo({ progress }: { progress?: { done: number; total: number } | null }) {
  const [pendingAction, setPendingAction] = useState<
    "mark_draining" | "unmark_draining" | "disable_provisioning" | "enable_provisioning" | null
  >(null);
  const [confirmCode, setConfirmCode] = useState("");

  return (
    <ServersBulkToolbar
      count={12}
      onSync={() => setPendingAction(null)}
      onMarkDraining={() => setPendingAction("mark_draining")}
      onUnmarkDraining={() => setPendingAction("unmark_draining")}
      onDisableProvisioning={() => setPendingAction("disable_provisioning")}
      onEnableProvisioning={() => setPendingAction("enable_provisioning")}
      onClear={() => setPendingAction(null)}
      onConfirmBulk={() => setPendingAction(null)}
      pendingAction={pendingAction}
      confirmCode={confirmCode}
      onConfirmCodeChange={setConfirmCode}
      isLoading={false}
      bulkSyncProgress={progress ?? null}
    />
  );
}

export const Overview: Story = {
  render: () => <Demo />,
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <Demo />
      <Demo progress={{ done: 3, total: 10 }} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Toolbar sizing is tokenized in CSS.</p>
      <Demo />
    </div>
  ),
};

export const States: Story = {
  render: () => <Demo />,
};

export const WithLongText: Story = {
  render: () => <Demo />,
};

export const EdgeCases = WithLongText;

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => <Demo />,
};

export const Accessibility: Story = {
  render: () => <Demo />,
};
