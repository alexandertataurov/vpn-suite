import { Link } from "react-router-dom";
import type { WebAppReferralMyLinkResponse, WebAppReferralStatsResponse } from "@vpn-suite/shared/types";
import { Panel, Button, Skeleton, InlineAlert } from "@vpn-suite/shared/ui";
import { useQuery } from "@tanstack/react-query";
import { getWebappToken, webappApi } from "../api/client";

export function ReferralPage() {
  const hasToken = !!getWebappToken();
  const {
    data: linkData,
    isFetching: linkFetching,
    error: linkError,
  } = useQuery<WebAppReferralMyLinkResponse>({
    queryKey: ["webapp", "referral", "link"],
    queryFn: () => webappApi.get<WebAppReferralMyLinkResponse>("/webapp/referral/my-link"),
    enabled: hasToken,
  });
  const linkLoading = linkFetching;
  const {
    data: statsData,
    error: statsError,
  } = useQuery<WebAppReferralStatsResponse>({
    queryKey: ["webapp", "referral", "stats"],
    queryFn: () => webappApi.get<WebAppReferralStatsResponse>("/webapp/referral/stats"),
    enabled: hasToken,
  });
  const linkPayload = linkData?.payload;
  const rawBot =
    typeof import.meta !== "undefined"
      ? (import.meta as { env?: { VITE_TELEGRAM_BOT_USERNAME?: string } }).env?.VITE_TELEGRAM_BOT_USERNAME
      : undefined;
  const botUsername = (rawBot ?? "").trim();
  const shareUrl = linkPayload && botUsername ? `https://t.me/${botUsername}?start=${linkPayload}` : "";

  const handleShare = () => {
    if (!shareUrl) return;
    if (navigator.share) {
      navigator.share({ title: "VPN", url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  if (!hasToken) {
    return (
      <div className="page-content">
        <h1 className="miniapp-page-title">Invite friend</h1>
        <InlineAlert
          variant="warning"
          title="Session missing"
          message="Your Telegram session is not active. Close and reopen the mini app from the bot to access referrals."
        />
        <Link to="/" className="miniapp-back-link">Back</Link>
      </div>
    );
  }

  if (linkError || statsError) {
    return (
      <div className="page-content">
        <h1 className="miniapp-page-title">Invite friend</h1>
        <InlineAlert
          variant="error"
          title="Referrals temporarily unavailable"
          message="We could not load your referral data. Please try again later."
        />
        <Link to="/" className="miniapp-back-link">Back</Link>
      </div>
    );
  }

  if (linkLoading || !linkData) {
    return (
      <div className="page-content">
        <h1 className="miniapp-page-title">Invite friend</h1>
        <Skeleton height={100} />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="miniapp-page-header">
        <div>
          <h1 className="miniapp-page-title">Invite friend</h1>
          <p className="miniapp-page-subtitle">Share your link and track rewards</p>
        </div>
      </div>
      <Link to="/" className="miniapp-back-link">Back</Link>
      <Panel>
        <p>Your referral link:</p>
        {!botUsername && (
          <p className="text-warning">
            Referral links are unavailable: bot username is not configured.
          </p>
        )}
        <code className="text-break fs-sm">{shareUrl || "Unavailable"}</code>
        <Button onClick={handleShare} className="mt-md" disabled={!shareUrl}>Share</Button>
        {statsData ? (
          <p className="mt-md text-muted">
            Referrals: {statsData.total_referrals} · Rewards: {statsData.rewards_applied}
          </p>
        ) : null}
      </Panel>
    </div>
  );
}
