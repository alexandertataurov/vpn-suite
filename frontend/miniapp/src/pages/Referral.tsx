import {
  Skeleton,
  PageCardSection,
  PageFrame,
  MissionAlert,
  MissionChip,
  MissionPrimaryButton,
  MissionProgressBar,
  MissionSecondaryButton,
  MissionSecondaryLink,
  SessionMissing,
} from "@/design-system";
import { FallbackScreen } from "@/design-system/patterns/FallbackScreen";
import { useReferralPageModel } from "@/page-models";

export function ReferralPage() {
  const model = useReferralPageModel();

  if (model.pageState.status === "empty") {
    return (
      <PageFrame title={model.header.title} className="referral-page">
        <SessionMissing message="Your Telegram session is not active. Tap Reconnect to sign in again, or close and reopen the app from the bot to access referrals." />
      </PageFrame>
    );
  }

  if (model.pageState.status === "error") {
    return (
      <FallbackScreen
        title={model.pageState.title ?? "Referrals temporarily unavailable"}
        message={model.pageState.message ?? "We could not load your referral data. Please try again later."}
        onRetry={model.pageState.onRetry}
      />
    );
  }

  if (model.pageState.status === "loading") {
    return (
      <PageFrame title={model.header.title} className="referral-page">
        <Skeleton className="skeleton-h-3xl" />
      </PageFrame>
    );
  }

  return (
    <PageFrame title={model.header.title} className="referral-page">
      {model.showUpsellReferral ? (
        <PageCardSection description="Upgrade your plan to get more from referrals." cardTone="blue">
          <MissionSecondaryLink to={model.referralUpsellTo}>Upgrade plan</MissionSecondaryLink>
        </PageCardSection>
      ) : null}
      <PageCardSection title="Share link" description="Invite friends and unlock bonus days." cardTone="green">
        {!model.botUsername ? (
          <MissionAlert
            tone="warning"
            title="Bot username missing"
            message="Referral links are unavailable: bot username is not configured."
          />
        ) : null}
        <code className="code-block type-meta">{model.shareUrl || "Unavailable"}</code>
        <div className="btn-row">
          <MissionPrimaryButton onClick={() => void model.handleShare()} disabled={!model.shareUrl || !model.isOnline}>
            Share secure access
          </MissionPrimaryButton>
          <MissionSecondaryButton onClick={() => void model.copyToClipboard()} disabled={!model.shareUrl || !model.isOnline}>
            Copy link
          </MissionSecondaryButton>
        </div>
      </PageCardSection>

      {model.statsData ? (
        <PageCardSection
          title="Reward progress"
          action={<MissionChip tone={model.rewardBadge.tone} className="section-meta-chip miniapp-tnum">{model.rewardBadge.label}</MissionChip>}
          description="Track reward velocity, current invite goal, and pending bonus days."
        >
          <div className="data-grid three">
            <div className="data-cell">
              <div className="dc-key">Earned days</div>
              <div className="dc-val miniapp-tnum">{model.earnedDays}</div>
            </div>
            <div className="data-cell">
              <div className="dc-key">Active referrals</div>
              <div className="dc-val miniapp-tnum">{model.activeReferrals}</div>
            </div>
            <div className="data-cell">
              <div className="dc-key">Pending rewards</div>
              <div className="dc-val miniapp-tnum">{model.pendingRewards}</div>
            </div>
          </div>
          <div className="data-grid wide">
            <div className="data-cell">
              <div className="dc-key">Total referrals</div>
              <div className="dc-val miniapp-tnum">{model.totalReferrals}</div>
            </div>
          </div>
          <p className="op-desc type-body-sm">
            Invite {model.inviteRemaining} more {model.inviteRemaining === 1 ? "friend" : "friends"} to unlock {model.nextBonusDays} bonus days
          </p>
          <MissionProgressBar percent={model.progressPercent} staticFill ariaLabel="Referral reward progress" />
          <p className="dc-key type-meta miniapp-tnum">
            {model.inviteProgress}/{model.inviteGoal} towards next bonus · Total invites: {model.totalReferrals}
          </p>
        </PageCardSection>
      ) : null}
    </PageFrame>
  );
}
