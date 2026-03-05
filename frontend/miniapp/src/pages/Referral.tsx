import { useCallback } from "react";
import { Link } from "react-router-dom";
import type {
  WebAppReferralMyLinkResponse,
  WebAppReferralStatsResponse,
} from "@/lib/types";
import {
  Panel,
  Button,
  Skeleton,
  InlineAlert,
  ProgressBar,
  Stat,
  useToast,
  PageFrame,
  PageSection,
  ActionRow,
} from "../ui";
import { useQuery } from "@tanstack/react-query";
import { useWebappToken, webappApi } from "../api/client";
import { useTelegramMainButton } from "../hooks/useTelegramMainButton";
import { useTelegramHaptics } from "../hooks/useTelegramHaptics";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { SessionMissing } from "@/components";

export function ReferralPage() {
  const { addToast } = useToast();
  const { notify, impact } = useTelegramHaptics();
  const hasToken = !!useWebappToken();
  const isOnline = useOnlineStatus();
  const {
    data: linkData,
    isFetching: linkFetching,
    error: linkError,
    refetch: refetchLink,
  } = useQuery<WebAppReferralMyLinkResponse>({
    queryKey: ["webapp", "referral", "link"],
    queryFn: () => webappApi.get<WebAppReferralMyLinkResponse>("/webapp/referral/my-link"),
    enabled: hasToken,
  });
  const {
    data: statsData,
    error: statsError,
    refetch: refetchStats,
  } = useQuery<WebAppReferralStatsResponse>({
    queryKey: ["webapp", "referral", "stats"],
    queryFn: () => webappApi.get<WebAppReferralStatsResponse>("/webapp/referral/stats"),
    enabled: hasToken,
  });
  const linkLoading = linkFetching;
  const linkPayload = linkData?.payload;
  const rawBot =
    typeof import.meta !== "undefined"
      ? (import.meta as { env?: { VITE_TELEGRAM_BOT_USERNAME?: string } }).env?.VITE_TELEGRAM_BOT_USERNAME
      : undefined;
  const botUsername = (rawBot ?? "").trim();
  const shareUrl =
    linkPayload && botUsername ? `https://t.me/${botUsername}?start=${linkPayload}` : "";

  const copyToClipboard = useCallback(async () => {
    if (!shareUrl) return;
    impact("medium");
    try {
      await navigator.clipboard.writeText(shareUrl);
      addToast("Link copied", "success");
      notify("success");
    } catch {
      addToast("Could not copy. Select and copy the link below.", "error");
      notify("error");
    }
  }, [shareUrl, impact, addToast, notify]);

  const handleShare = useCallback(async () => {
    if (!shareUrl) return;
    impact("medium");
    if (navigator.share) {
      try {
        await navigator.share({ title: "VPN", url: shareUrl });
        addToast("Link shared", "success");
        notify("success");
      } catch {
        await copyToClipboard();
      }
    } else {
      await copyToClipboard();
    }
  }, [shareUrl, impact, addToast, notify, copyToClipboard]);

  const handleRetry = useCallback(() => {
    refetchLink();
    refetchStats();
  }, [refetchLink, refetchStats]);
  const pageTitle = "Referral Program";
  const pageSubtitle = "Share your link and track rewards";
  const backHomeLink = (
    <Link to="/" className="link-interactive page-anchor-link">
      Back
    </Link>
  );

  useTelegramMainButton(null);

  if (!hasToken) {
    return (
      <PageFrame title={pageTitle} subtitle={pageSubtitle}>
        <SessionMissing message="Your Telegram session is not active. Tap Reconnect to sign in again, or close and reopen the app from the bot to access referrals." />
      </PageFrame>
    );
  }

  if (linkError || statsError) {
    return (
      <PageFrame title={pageTitle} subtitle={pageSubtitle}>
        <InlineAlert
          variant="error"
          title="Referrals temporarily unavailable"
          message="We could not load your referral data. Please try again later."
        />
        <ActionRow fullWidth>
          <Button variant="secondary" size="sm" onClick={handleRetry}>
            Try again
          </Button>
          {backHomeLink}
        </ActionRow>
      </PageFrame>
    );
  }

  if (linkLoading || !linkData) {
    return (
      <PageFrame title={pageTitle} subtitle={pageSubtitle}>
        <Skeleton className="skeleton-h-3xl" />
      </PageFrame>
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
    <PageFrame title={pageTitle} subtitle={pageSubtitle}>
      <ActionRow>{backHomeLink}</ActionRow>

      <PageSection title="SHARE LINK" description="Invite friends and unlock bonus days.">
        <Panel variant="surface" className="card edge eg module-card">
          {!botUsername && (
            <InlineAlert
              variant="warning"
              title="Bot username missing"
              message="Referral links are unavailable: bot username is not configured."
            />
          )}
          <code className="code-block type-meta">{shareUrl || "Unavailable"}</code>
          <ActionRow fullWidth>
            <Button onClick={handleShare} disabled={!shareUrl || !isOnline}>
              SHARE SECURE ACCESS
            </Button>
          </ActionRow>
        </Panel>
      </PageSection>

      {statsData && (
        <PageSection
          title="REWARD TELEMETRY"
          action={<span className="chip cn section-meta-chip miniapp-tnum">{inviteProgress}/{inviteGoal}</span>}
        >
          <Panel variant="surface" className="card edge eb module-card">
            <div className="stats-row referral-metrics">
              <Stat label="EARNED DAYS" value={earnedDays.toString()} />
              <Stat label="ACTIVE REFERRALS" value={activeReferrals.toString()} />
              <Stat label="PENDING REWARDS" value={pendingRewards.toString()} />
              <Stat label="TOTAL REFERRALS" value={totalReferrals.toString()} />
            </div>
            <p className="module-note">
              Invite {inviteRemaining} more {inviteRemaining === 1 ? "friend" : "friends"} to unlock {nextBonusDays} bonus days
            </p>
            <ProgressBar value={progressPercent} max={100} />
            <p className="type-meta miniapp-tnum">
              {inviteProgress}/{inviteGoal} towards next bonus · Total invites: {totalReferrals}
            </p>
          </Panel>
        </PageSection>
      )}
    </PageFrame>
  );
}
