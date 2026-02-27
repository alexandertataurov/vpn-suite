import { Panel } from "@vpn-suite/shared/ui";
import { Link } from "react-router-dom";

export interface DeviceLimitNudgeProps {
  used: number;
  limit: number;
}

export function DeviceLimitNudge({ used, limit }: DeviceLimitNudgeProps) {
  const atLimit = used >= limit;
  const message = atLimit
    ? `You're at the device limit (${limit}). Revoke a device in Devices to add another.`
    : `You have ${limit - used} device slot${limit - used === 1 ? "" : "s"} left.`;

  return (
    <Panel className="card mb-md p-md">
      <p className="fs-sm mb-sm text-muted">{message}</p>
      <Link to="/devices">
        <span className="button button-secondary button-sm">Manage devices</span>
      </Link>
    </Panel>
  );
}
