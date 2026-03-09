import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { WebAppReferralMyLinkResponse, WebAppReferralStatsResponse } from "@vpn-suite/shared";
import { getPlans } from "@/api";
import { useWebappToken, webappApi } from "@/api/client";
import { useSession } from "@/hooks/useSession";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";
import { useTelegramMainButton } from "@/hooks/useTelegramMainButton";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useToast } from "@/design-system";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import type { PlanItem, PlansResponse } from "@/api";
import type { StandardPageHeader, StandardPageState, StandardSectionBadge } from "./types";
import { getActiveSubscription, shouldShowUpsell } from "./helpers";
import { getUpgradeOfferForIntent, type PlanLikeForUpsell } from "./upsell";
import { telegramBotUsername } from "@/config/env";

export function useReferralPageModel() {
  const { addToast } = useToast();
  const { notify, impact } = useTelegramHaptics();
  const hasToken = !!useWebappToken();
  const isOnline = useOnlineStatus();
  const { data: session } = useSession(hasToken);
  const { data: plansData } = useQuery<PlansResponse>({
    queryKey: [...webappQueryKeys.plans()],
    queryFn: getPlans,
    enabled: hasToken,
  });
  const plans = useMemo(() => plansData?.items ?? [], [plansData?.items]);
  const activeSub = getActiveSubscription(session);
  const currentPlan = useMemo<PlanItem | undefined>(
    () => (activeSub?.plan_id ? plans.find((p) => p.id === activeSub.plan_id) : undefined),
    [plans, activeSub?.plan_id],
  );
  const showUpsellReferral = shouldShowUpsell(currentPlan?.upsell_methods, "referral");
  const referralOffer = showUpsellReferral
    ? getUpgradeOfferForIntent(plans as PlanLikeForUpsell[], currentPlan, "referral", "referral")
    : null;
  const referralUpsellTo = referralOffer?.targetTo ?? "/plan?intent=referral";

  useTrackScreen("referral", activeSub?.plan_id ?? null);
  const {
    data: linkData,
    isFetching: linkFetching,
    error: linkError,
    refetch: refetchLink,
  } = useQuery<WebAppReferralMyLinkResponse>({
    queryKey: [...webappQueryKeys.referralLink()],
    queryFn: () => webappApi.get<WebAppReferralMyLinkResponse>("/webapp/referral/my-link"),
    enabled: hasToken,
  });
  const {
    data: statsData,
    error: statsError,
    refetch: refetchStats,
  } = useQuery<WebAppReferralStatsResponse>({
    queryKey: [...webappQueryKeys.referralStats()],
    queryFn: () => webappApi.get<WebAppReferralStatsResponse>("/webapp/referral/stats"),
    enabled: hasToken,
  });

  useTelegramMainButton(null);

  const linkPayload = linkData?.payload;
  const fromApi = (linkData?.bot_username ?? "").trim();
  const botUsername = fromApi || telegramBotUsername;

  const refetchedForEmptyBotRef = useRef(false);
  useEffect(() => {
    if (linkData == null || botUsername || refetchedForEmptyBotRef.current) return;
    refetchedForEmptyBotRef.current = true;
    void refetchLink();
  }, [linkData, botUsername, refetchLink]);
  const shareUrl = linkPayload && botUsername ? `https://t.me/${botUsername}?startapp=${linkPayload}` : "";

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

  const header: StandardPageHeader = {
    title: "Referrals",
    subtitle: "Share your link and track rewards",
  };

  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: "Session missing" }
    : linkError || statsError
      ? {
          status: "error",
          title: "Referrals temporarily unavailable",
          message: "We could not load your referral data. Please try again later.",
          onRetry: () => {
            refetchLink();
            refetchStats();
          },
        }
      : linkFetching || !linkData
        ? { status: "loading" }
        : { status: "ready" };

  const earnedDays = statsData?.earned_days ?? 0;
  const totalReferrals = statsData?.total_referrals ?? 0;
  const pendingRewards = statsData?.pending_rewards ?? 0;
  const activeReferrals = statsData?.active_referrals ?? 0;
  const inviteGoal = statsData?.invite_goal ?? 2;
  const inviteProgress = statsData?.invite_progress ?? 0;
  const inviteRemaining = statsData?.invite_remaining ?? Math.max(inviteGoal - inviteProgress, 0);
  const progressPercent = inviteGoal > 0 ? Math.min(100, Math.max(0, (inviteProgress / inviteGoal) * 100)) : 0;
  const nextBonusDays = inviteGoal * 7;
  const rewardBadge: StandardSectionBadge = {
    tone: "neutral",
    label: `${inviteProgress} / ${inviteGoal}`,
    emphasizeNumeric: true,
  };

  return {
    header,
    pageState,
    statsData,
    shareUrl,
    botUsername,
    isOnline,
    earnedDays,
    totalReferrals,
    pendingRewards,
    activeReferrals,
    inviteGoal,
    inviteProgress,
    inviteRemaining,
    progressPercent,
    nextBonusDays,
    rewardBadge,
    showUpsellReferral,
    referralUpsellTo,
    handleShare,
    copyToClipboard,
  };
}
