import { useCallback } from "react";
import type {
  WebAppReferralMyLinkResponse,
  WebAppReferralStatsResponse,
} from "@vpn-suite/shared";
import {
  Skeleton,
  useToast,
  PageFrame,
  PageSection,
  MissionAlert,
  MissionCard,
  MissionChip,
  MissionModuleHead,
  MissionPrimaryButton,
  MissionProgressBar,
  MissionSecondaryButton,
  SessionMissing,
} from "@/design-system";
import { useQuery } from "@tanstack/react-query";
import { useWebappToken, webappApi } from "@/api/client";
import { useTelegramMainButton } from "@/hooks/useTelegramMainButton";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

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
  const pageTitle = "Referrals";
  const pageSubtitle = "Share your link and track rewards";

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
        <MissionCard tone="red" className="module-card">
          <MissionAlert
            tone="error"
            title="Referrals temporarily unavailable"
            message="We could not load your referral data. Please try again later."
          />
          <div className="btn-row">
            <MissionSecondaryButton onClick={handleRetry}>
              Try again
            </MissionSecondaryButton>
          </div>
        </MissionCard>
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
      <PageSection title="Share link" description="Invite friends and unlock bonus days.">
        <MissionCard tone="green" className="module-card">
          {!botUsername && (
            <MissionAlert
              tone="warning"
              title="Bot username missing"
              message="Referral links are unavailable: bot username is not configured."
            />
          )}
          <MissionModuleHead
            label="Invite URL"
            chip={<MissionChip tone="neutral">Secure</MissionChip>}
          />
          <code className="code-block type-meta">{shareUrl || "Unavailable"}</code>
          <div className="btn-row">
            <MissionPrimaryButton onClick={handleShare} disabled={!shareUrl || !isOnline}>
              Share secure access
            </MissionPrimaryButton>
            <MissionSecondaryButton onClick={copyToClipboard} disabled={!shareUrl || !isOnline}>
              Copy link
            </MissionSecondaryButton>
          </div>
        </MissionCard>
      </PageSection>

      {statsData && (
        <PageSection
          title="Reward progress"
          action={<MissionChip tone="neutral" className="section-meta-chip miniapp-tnum">{inviteProgress} / {inviteGoal}</MissionChip>}
        >
          <MissionCard tone="blue" className="module-card">
            <div className="data-grid three">
              <div className="data-cell">
                <div className="dc-key">Earned days</div>
                <div className="dc-val miniapp-tnum">{earnedDays}</div>
              </div>
              <div className="data-cell">
                <div className="dc-key">Active referrals</div>
                <div className="dc-val miniapp-tnum">{activeReferrals}</div>
              </div>
              <div className="data-cell">
                <div className="dc-key">Pending rewards</div>
                <div className="dc-val miniapp-tnum">{pendingRewards}</div>
              </div>
            </div>
            <div className="data-grid wide">
              <div className="data-cell">
                <div className="dc-key">Total referrals</div>
                <div className="dc-val miniapp-tnum">{totalReferrals}</div>
              </div>
            </div>
            <p className="op-desc type-body-sm">
              Invite {inviteRemaining} more {inviteRemaining === 1 ? "friend" : "friends"} to unlock {nextBonusDays} bonus days
            </p>
            <MissionProgressBar percent={progressPercent} staticFill ariaLabel="Referral reward progress" />
            <p className="dc-key type-meta miniapp-tnum">
              {inviteProgress}/{inviteGoal} towards next bonus · Total invites: {totalReferrals}
            </p>
          </MissionCard>
        </PageSection>
      )}
    </PageFrame>
  );
}
