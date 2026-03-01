import { Link } from "react-router-dom";
import { Body, Caption } from "../ui";

export interface HomeDynamicBlockProps {
  daysLeft: number;
  hasSub: boolean;
  deviceLimit: number | null;
  usedDevices: number;
  healthError: boolean;
}

export function HomeDynamicBlock({
  daysLeft,
  hasSub,
  deviceLimit,
  usedDevices,
  healthError,
}: HomeDynamicBlockProps) {
  const items: { type: "expiring" | "device" | "health"; content: React.ReactNode }[] = [];

  if (healthError) {
    items.push({
      type: "health",
      content: (
        <div className="home-dynamic-item home-dynamic-item--warning">
          <Body className="home-dynamic-item-text">
            Service may be degraded. We detected a backend issue.
          </Body>
        </div>
      ),
    });
  }

  if (hasSub && daysLeft <= 7) {
    const message =
      daysLeft <= 0
        ? "Plan expired. Renew to stay protected."
        : daysLeft === 1
          ? "Plan ends tomorrow. Renew to stay protected."
          : `Plan ends in ${daysLeft} days. Renew to stay protected.`;
    items.push({
      type: "expiring",
      content: (
        <div className="home-dynamic-item home-dynamic-item--expiring">
          <Body className="home-dynamic-item-text">{message}</Body>
          <Link to="/plan" className="home-dynamic-item-link">
            Renew
          </Link>
        </div>
      ),
    });
  }

  if (deviceLimit != null && usedDevices >= deviceLimit - 1) {
    const atLimit = usedDevices >= deviceLimit;
    const message = atLimit
      ? `Device limit (${deviceLimit}). Revoke a device to add another.`
      : `${deviceLimit - usedDevices} device slot${deviceLimit - usedDevices === 1 ? "" : "s"} left.`;
    items.push({
      type: "device",
      content: (
        <div className="home-dynamic-item home-dynamic-item--device">
          <Body className="home-dynamic-item-text">{message}</Body>
          <Link to="/devices" className="home-dynamic-item-link">
            Manage devices
          </Link>
        </div>
      ),
    });
  }

  if (items.length === 0) {
    return (
      <div className="home-dynamic-block">
        <Caption className="home-dynamic-empty">You&apos;re all set</Caption>
      </div>
    );
  }

  return (
    <div className="home-dynamic-block">
      {items.map((item, i) => (
        <div
          key={i}
          className={`home-dynamic-item-wrap${i < items.length - 1 ? " home-dynamic-item-wrap--divider" : ""}`}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
