import { Link } from "react-router-dom";
import { MissionAlert } from "@/design-system";

export interface ConfigCardContentProps {
  configText: string;
  routeReason: string;
  peerCreated?: boolean;
  onCopy: () => Promise<void>;
  onDownload: () => void;
  recommendedRoute: string;
}

/** Reusable config block: alert(s) + copy/download actions + pre. */
export function ConfigCardContent({
  configText,
  routeReason,
  peerCreated = true,
  onCopy,
  onDownload,
  recommendedRoute,
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
          <div className="device-actions-inline">
            <button
              type="button"
              className="link-interactive"
              onClick={() => void onCopy()}
              aria-label="Copy config"
            >
              Copy config
            </button>
            <span className="device-actions-sep" aria-hidden> · </span>
            <button
              type="button"
              className="link-interactive"
              onClick={onDownload}
              aria-label="Download config file"
            >
              Download .conf file
            </button>
            {isPending ? (
              <>
                <span className="device-actions-sep" aria-hidden> · </span>
                <Link to={recommendedRoute} className="link-interactive" aria-label="Confirm device installation">
                  Confirm device installation
                </Link>
              </>
            ) : null}
          </div>
        )}
      />
      {!peerCreated ? (
        <MissionAlert
          tone="warning"
          title="Server sync pending"
          message="The device is registered. If connection fails, retry later or contact support."
        />
      ) : null}
      <pre className="config-pre config-block">{configText}</pre>
    </>
  );
}
