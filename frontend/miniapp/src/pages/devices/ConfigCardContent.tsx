import { MissionAlert, Button, IconDownload } from "@/design-system";

export interface ConfigCardContentProps {
  configText: string;
  routeReason: string;
  peerCreated?: boolean;
  onCopy: () => Promise<void>;
  onDownload: () => void;
}

/** Reusable config block: alert(s) + copy/download actions + pre. */
export function ConfigCardContent({
  configText,
  routeReason,
  peerCreated = true,
  onCopy,
  onDownload,
}: ConfigCardContentProps) {
  const isPending = routeReason === "connection_not_confirmed";
  const message = isPending
    ? "Copy or download, import in your VPN app, then confirm."
    : "Config may not be visible after leaving. Copy or download now.";

  return (
    <>
      <MissionAlert
        tone="info"
        title="Shown only once"
        message={message}
        actions={(
          <div className="miniapp-compact-actions">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void onCopy()}
              aria-label="Copy config"
              className="miniapp-compact-action"
            >
              Copy config
            </Button>
            <Button type="button" variant="link" size="sm" onClick={onDownload} className="miniapp-inline-link">
              <IconDownload size={14} strokeWidth={1.8} />
              <span>Download config</span>
            </Button>
          </div>
        )}
      />
      {!peerCreated ? (
        <MissionAlert
          tone="warning"
          title="Server sync pending"
          message="The device is registered, but backend provisioning is still finishing. Retry later or contact support if setup does not complete."
        />
      ) : null}
      <pre className="config-pre config-block">{configText}</pre>
    </>
  );
}
