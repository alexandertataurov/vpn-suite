import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Skeleton,
  Modal,
  PageCardSection,
  PageFrame,
  PageHeaderBadge,
  PageSection,
  AccountSummaryHero,
  DangerZone,
  FormField,
  MissionAlert,
  MissionCard,
  MissionChip,
  MissionOperationArticle,
  MissionOperationLink,
  MissionPrimaryButton,
  MissionSecondaryButton,
  MissionSecondaryLink,
  SegmentedControl,
  SessionMissing,
  SettingsCard,
  SettingsDivider,
  IconSmartphone,
  IconCreditCard,
  IconGlobe,
  IconUsers,
  IconHelpCircle,
  IconUser,
  Button,
  FallbackScreen,
} from "@/design-system";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";
import { useSettingsPageModel } from "@/page-models";

export function SettingsPage() {
  const location = useLocation();
  const { impact } = useTelegramHaptics();
  const model = useSettingsPageModel();
  const [profileEditing, setProfileEditing] = useState(false);
  const discountPercent = model.offers?.discount_percent;
  const cancelOpen = model.cancelOpen;
  const track = model.track;

  useEffect(() => {
    if (cancelOpen && discountPercent && discountPercent > 0) {
      track("retention_offer_shown", { discount_percent: discountPercent });
    }
  }, [cancelOpen, discountPercent, track]);

  if (model.pageState.status === "empty") {
    return <SessionMissing />;
  }

  if (model.pageState.status === "error") {
    return (
      <FallbackScreen
        title={model.pageState.title ?? "Could not load"}
        message={model.pageState.message ?? "We could not load settings. Please try again or contact support."}
        onRetry={model.pageState.onRetry}
      />
    );
  }

  if (model.pageState.status === "loading") {
    return (
      <PageFrame title={model.header.title} className="settings-page">
        <Skeleton variant="card" />
      </PageFrame>
    );
  }

  return (
    <PageFrame
      title={model.header.title}
      headerAction={model.header.badge ? <PageHeaderBadge {...model.header.badge} /> : null}
      className="settings-page"
    >
      <AccountSummaryHero
        initial={model.accountSummary.initial}
        name={model.accountSummary.name}
        email={model.accountSummary.email}
        photoUrl={model.accountSummary.photoUrl}
        memberSince={model.accountSummary.memberSince}
        className="stagger-1"
      />
      <PageSection title="Account" className="stagger-2">
        <SettingsCard className="stagger-3 settings-page module-card">
          {model.profileIncomplete && (
            <MissionAlert
              tone="info"
              title="Complete your profile"
              message="Add your name, email, and phone so we can reach you."
            />
          )}
          {model.profileIncomplete && <SettingsDivider />}
          <MissionOperationArticle
            as="div"
            role="button"
            tabIndex={0}
            tone="blue"
            iconTone="blue"
            icon={<IconUser size={20} strokeWidth={1.6} />}
            title="Edit profile"
            description="Name, email, phone"
            showChevron
            className={profileEditing ? "op-expanded" : ""}
            onClick={() => {
              impact("light");
              setProfileEditing((e) => !e);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                impact("light");
                setProfileEditing((prev) => !prev);
              }
            }}
            aria-expanded={profileEditing}
            aria-label={profileEditing ? "Collapse profile form" : "Edit profile"}
          />
          {profileEditing && (
            <>
              <SettingsDivider />
              <FormField
                label="Name"
                input={
                  <input
                    type="text"
                    className="input field-input"
                    value={model.profileDisplayName}
                    onChange={(e) => model.setProfileDisplayName(e.target.value)}
                    placeholder="Your name"
                    aria-label="Display name"
                  />
                }
              />
              <SettingsDivider />
              <FormField
                label="Email"
                input={
                  <input
                    type="email"
                    className="input field-input"
                    value={model.profileEmail}
                    onChange={(e) => model.setProfileEmail(e.target.value)}
                    placeholder="you@example.com"
                    aria-label="Email"
                  />
                }
              />
              <SettingsDivider />
              <FormField
                label="Phone"
                input={
                  <input
                    type="tel"
                    className="input field-input"
                    value={model.profilePhone}
                    onChange={(e) => model.setProfilePhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                    aria-label="Phone"
                  />
                }
              />
              <div className="btn-row settings-profile-actions">
                <MissionPrimaryButton
                  onClick={() => {
                    impact("light");
                    model.saveProfile();
                    setProfileEditing(false);
                  }}
                  disabled={model.updateProfileMutation.isPending}
                >
                  {model.updateProfileMutation.isPending ? "Saving…" : "Save profile"}
                </MissionPrimaryButton>
              </div>
            </>
          )}
          <SettingsDivider />
          <div className="field-group">
            <div className="field-label">Language</div>
            <SegmentedControl
              options={model.profileLocaleOptions.map((o) => ({ id: o.id, label: o.label }))}
              activeId={model.profileLocale}
              onSelect={(id) => {
                impact("light");
                model.setProfileLocale(id as typeof model.profileLocale);
                model.updateProfileMutation.mutate({ locale: id });
              }}
              ariaLabel="Language"
            />
          </div>
          <SettingsDivider />
          <div className="data-cell">
            <div className="dc-key">Notifications</div>
            <div className="dc-val">Bot reminders</div>
          </div>
        </SettingsCard>
      </PageSection>
      <PageSection title="Quick links" className="stagger-4">
      <div className="stagger-5 ops settings-ops">
        <MissionOperationLink
          to="/devices"
          state={{ from: location.pathname }}
          tone="blue"
          iconTone="blue"
          icon={<IconSmartphone size={20} strokeWidth={1.6} />}
          title="Devices"
          description={model.activeDevices.length > 0 ? `${model.activeDevices.length} active` : "No active devices"}
          onClick={() => impact("light")}
          aria-label="Devices"
        />
        <MissionOperationLink
          to="/plan"
          state={{ from: location.pathname }}
          tone="green"
          iconTone="green"
          icon={<IconCreditCard size={20} strokeWidth={1.6} />}
          title="Plans & billing"
          description="Subscription and renewals"
          onClick={() => impact("light")}
          aria-label="Plans and billing"
        />
        <MissionOperationLink
          to="/servers"
          state={{ from: location.pathname }}
          tone="amber"
          iconTone="amber"
          icon={<IconGlobe size={20} strokeWidth={1.6} />}
          title="Change server"
          description="Route and region"
          onClick={() => impact("light")}
          aria-label="Change server"
        />
        <MissionOperationLink
          to="/referral"
          state={{ from: location.pathname }}
          tone="blue"
          iconTone="blue"
          icon={<IconUsers size={20} strokeWidth={1.6} />}
          title="Referral link"
          description="Invite and earn rewards"
          onClick={() => impact("light")}
          aria-label="Referral link"
        />
        <MissionOperationLink
          to="/support"
          state={{ from: location.pathname }}
          tone="red"
          iconTone="red"
          icon={<IconHelpCircle size={20} strokeWidth={1.6} />}
          title="Support"
          description="Connection help"
          onClick={() => impact("light")}
          aria-label="Support"
        />
      </div>
      </PageSection>

      {model.offersLoading ? (
        <MissionCard tone="blue" className="module-card">
          <Skeleton className="skeleton-h-md" />
          <Skeleton className="skeleton-h-sm" />
        </MissionCard>
      ) : null}
      {model.offersError ? (
        <PageCardSection cardTone="red">
          <MissionAlert
            tone="error"
            title="Subscription options unavailable"
            message="Subscription options could not be loaded. Try again later."
          />
          <div className="btn-row">
            <MissionSecondaryButton onClick={model.refetchOffers}>Try again</MissionSecondaryButton>
          </div>
        </PageCardSection>
      ) : null}
      {model.offers && !model.offersError && (model.offers.can_pause || model.offers.can_resume) ? (
        <PageCardSection
          title="Subscription operations"
          description={`Loyalty discount ${model.offers.discount_percent}%`}
          action={<MissionChip tone={model.offersBadge.tone} className="section-meta-chip miniapp-tnum">{model.offersBadge.label}</MissionChip>}
          className="settings-section settings-section--subscription"
          cardTone="amber"
        >
          <div className="btn-row">
            <MissionSecondaryButton disabled={!model.offers.can_pause || model.pauseMutation.isPending} onClick={() => model.pauseMutation.mutate()}>
              {model.pauseMutation.isPending ? "Pausing…" : "Pause"}
            </MissionSecondaryButton>
            <MissionSecondaryButton disabled={!model.offers.can_resume || model.resumeMutation.isPending} onClick={() => model.resumeMutation.mutate()}>
              {model.resumeMutation.isPending ? "Resuming…" : "Resume"}
            </MissionSecondaryButton>
          </div>
          <MissionPrimaryButton tone="danger" onClick={() => model.openCancelFlow()} disabled={model.cancelMutation.isPending}>
            Cancel subscription
          </MissionPrimaryButton>
        </PageCardSection>
      ) : null}

      {model.activeDevices.length > 0 ? (
        <DangerZone
          title="Reset configs"
          description="Revoke all device configs. You will need to add devices again."
          buttonLabel="Reset all configs"
          confirmTitle="Reset all configs?"
          confirmMessage="This will revoke every device config. You can add new devices afterward."
          confirmLabel="Reset"
          cancelLabel="Cancel"
          onConfirm={() => model.revokeAllMutation.mutate()}
          loading={model.revokeAllMutation.isPending}
        />
      ) : null}

      <Modal
        open={model.cancelOpen}
        onClose={() => !model.cancelMutation.isPending && model.setCancelOpen(false)}
        title="Cancel subscription?"
        description="Pick a reason and choose how to proceed."
        footer={
          <Button
            type="button"
            variant="ghost"
            onClick={() => !model.cancelMutation.isPending && model.setCancelOpen(false)}
          >
            Keep subscription
          </Button>
        }
      >
        <div className="cancel-flow-body">
          <div className="field-group">
            <div className="field-label">Reason</div>
            <SegmentedControl
              activeId={model.cancelReason}
              options={[
                { id: "price", label: "Too expensive" },
                { id: "not_needed", label: "Not using" },
                { id: "technical", label: "Technical issues" },
                { id: "other", label: "Other" },
              ]}
              onSelect={(id) => model.setCancelReasonWithTrack(id as typeof model.cancelReason)}
            />
          </div>
          {model.offers && (model.offers.offer_discount || (model.offers.discount_percent ?? 0) > 0) && (
            <p className="modal-message type-body-sm">
              Loyalty offer: {model.offers.discount_percent}% off your next renewal if you stay.
            </p>
          )}
          {model.offers?.offer_downgrade && (
            <p className="modal-message type-body-sm">
              <MissionSecondaryLink to="/plan">Switch to a cheaper plan</MissionSecondaryLink> instead of cancelling.
            </p>
          )}
          <div className="btn-row cancel-flow-actions">
            {(model.offers?.offer_pause ?? model.offers?.can_pause) && (
              <MissionSecondaryButton
                onClick={() => model.handleCancelAction({ pause_instead: true, offer_accepted: false })}
                disabled={model.cancelMutation.isPending}
              >
                {model.cancelMutation.isPending ? "…" : "Pause instead"}
              </MissionSecondaryButton>
            )}
            <MissionSecondaryButton
              onClick={() =>
                model.handleCancelAction({
                  cancel_at_period_end: true,
                  offer_accepted: !!(model.offers?.offer_discount ?? model.offers?.discount_percent),
                })
              }
              disabled={model.cancelMutation.isPending}
            >
              {model.cancelMutation.isPending ? "…" : "Cancel at period end"}
            </MissionSecondaryButton>
            <MissionPrimaryButton
              tone="danger"
              onClick={() =>
                model.handleCancelAction({
                  cancel_at_period_end: false,
                  offer_accepted: false,
                })
              }
              disabled={model.cancelMutation.isPending}
            >
              {model.cancelMutation.isPending ? "…" : "Cancel now"}
            </MissionPrimaryButton>
          </div>
        </div>
      </Modal>
    </PageFrame>
  );
}
