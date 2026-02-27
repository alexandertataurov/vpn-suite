import { Link } from "react-router-dom";
import type {
  WebAppReferralMyLinkResponse,
  WebAppReferralStatsResponse,
} from "@vpn-suite/shared/types";
import { Panel, Button, Skeleton, InlineAlert, ProgressBar, Stat } from "@vpn-suite/shared/ui";
import { useQuery } from "@tanstack/react-query";
import { getWebappToken, webappApi } from "../api/client";
import { useTelegramBackButton } from "../hooks/useTelegramBackButton";
import { useTelegramMainButton } from "../hooks/useTelegramMainButton";
import { useTelegramHaptics } from "../hooks/useTelegramHaptics";
import { useToast } from "@vpn-suite/shared/ui";
import { SessionMissing } from "../components/SessionMissing";

export function ReferralPage() {
  useTelegramBackButton(true);
  const { addToast } = useToast();
  const { notify, impact } = useTelegramHaptics();
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
  const shareUrl =
    linkPayload && botUsername ? `https://t.me/${botUsername}?start=${linkPayload}` : "";

  const handleShare = () => {
    if (!shareUrl) return;
    impact("medium");
    if (navigator.share) {
      navigator.share({ title: "VPN", url: shareUrl }).then(
        () => {
          addToast("Link shared", "success");
          notify("success");
        },
        () => {
          fallbackCopy();
        },
      );
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    if (!shareUrl) return;
    impact("medium");
    navigator.clipboard.writeText(shareUrl);
    addToast("Link copied", "success");
    notify("success");
  };

  useTelegramMainButton(
    !!shareUrl
      ? {
          text: "Copy link",
          visible: true,
          enabled: true,
          loading: false,
          onClick: fallbackCopy,
        }
      : null,
  );

  if (!hasToken) {
    return (
      <>
        <SessionMissing message="Your Telegram session is not active. Tap Reconnect to sign in again, or close and reopen the app from the bot to access referrals." />
        <div className="page-content">
          <Link to="/" className="miniapp-back-link">Back</Link>
        </div>
      </>
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

  const earnedDays = statsData?.earned_days ?? 0;
  const totalReferrals = statsData?.total_referrals ?? 0;
  const pendingRewards = statsData?.pending_rewards ?? 0;
  const activeReferrals = statsData?.active_referrals ?? 0;
  const inviteGoal = statsData?.invite_goal ?? 2;
  const inviteProgress = statsData?.invite_progress ?? 0;
  const inviteRemaining = statsData?.invite_remaining ?? Math.max(inviteGoal - inviteProgress, 0);
  const progressPercent =
    inviteGoal > 0 ? Math.min(100, Math.max(0, (inviteProgress / inviteGoal) * 100)) : 0;
  const nextBonusDays = inviteGoal * 7;

  return (
    <div className="page-content">
      <div className="miniapp-page-header">
        <div>
          <h1 className="miniapp-page-title">Invite friend</h1>
          <p className="miniapp-page-subtitle">Share your link and track rewards</p>
        </div>
      </div>
      <Link to="/" className="miniapp-back-link">Back</Link>
      <Panel className="card mb-lg">
        <p className="text-muted fs-sm mb-xs">Your referral link</p>
        {!botUsername && (
          <p className="text-warning">
            Referral links are unavailable: bot username is not configured.
          </p>
        )}
        <code className="text-break fs-sm">{shareUrl || "Unavailable"}</code>
        <Button onClick={handleShare} className="mt-md" disabled={!shareUrl}>
          Share secure access
        </Button>
      </Panel>
      {statsData && (
        <Panel className="card mb-lg">
          <div className="referral-stats-row">
            <Stat label="Earned days" value={earnedDays.toString()} />
            <Stat label="Active referrals" value={activeReferrals.toString()} />
            <Stat label="Pending rewards" value={pendingRewards.toString()} />
          </div>
          <div className="mt-md">
            <p className="fs-sm mb-xs">
              Invite {inviteRemaining} more{" "}
              {inviteRemaining === 1 ? "friend" : "friends"} → unlock{" "}
              {nextBonusDays} bonus days
            </p>
            <ProgressBar value={progressPercent} max={100} />
            <p className="fs-xs text-muted mt-xs">
              {inviteProgress}/{inviteGoal} towards next bonus · Total invites: {totalReferrals}
            </p>
          </div>
        </Panel>
      )}
    </div>
  );
}
