import { InlineAlert } from "@vpn-suite/shared/ui";
import { Link } from "react-router-dom";

export interface ExpiringSoonBannerProps {
  daysLeft: number;
}

export function ExpiringSoonBanner({ daysLeft }: ExpiringSoonBannerProps) {
  const message =
    daysLeft <= 0
      ? "Your plan has expired. Renew to stay protected."
      : daysLeft === 1
        ? "Your plan ends tomorrow. Renew to stay protected."
        : `Your plan ends in ${daysLeft} days. Renew to stay protected.`;

  return (
    <div className="mb-md">
      <InlineAlert
        variant="warning"
        title="Plan expiring soon"
        message={message}
        actions={
          <Link to="/plan" className="button button-secondary mt-sm">
            Renew
          </Link>
        }
      />
    </div>
  );
}
