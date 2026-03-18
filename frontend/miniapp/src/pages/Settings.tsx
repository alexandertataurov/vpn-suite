import { useEffect, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AccountCancellationModal,
  SessionMissing,
  SettingsAccountOverviewCard,
  SettingsLanguageMenuRow,
  SubscriptionCancellationModal,
} from "@/components";
import { getSupportBotHref } from "@/config/env";
import {
  IconChevronRight,
  IconCircleX,
  IconCreditCard,
  IconHelpCircle,
  IconMessageCircle,
  IconPencil,
  IconRotateCw,
  IconShield,
  IconSmartphone,
  IconTrash2,
} from "@/design-system/icons";
import {
  Button,
  FallbackScreen,
  FooterHelp,
  HelperNote,
  Input,
  ListCard,
  ListRow,
  Modal,
  PageHeader,
  PageScaffold,
  PageSection,
  Skeleton,
  ToggleRow,
  useToast,
} from "@/design-system";
import { Stack } from "@/design-system/core/primitives";
import { useOpenLink, useI18n, useTelegramWebApp, useUpdateSubscription } from "@/hooks";
import { useSettingsPageModel } from "@/page-models";

export function SettingsPage() {
  const model = useSettingsPageModel();
  const { openLink } = useOpenLink();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { initData } = useTelegramWebApp();
  const { t } = useI18n();
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const supportHref = getSupportBotHref();
  const autoRenewEnabled = model.activeSub?.auto_renew ?? true;
  const [autoRenew, setAutoRenew] = useState(autoRenewEnabled);
  const profileModalOpen = searchParams.get("modal") === "profile";
  const autoRenewDescription =
    model.renewalDate && autoRenew
      ? t("plan.renewal_description_with_date", { date: model.renewalDate })
      : model.activeSub
        ? model.cancelPlanDescription
        : t("settings.auto_renew_description");

  const { mutate: updateAutoRenew, isPending: isAutoRenewUpdating } = useUpdateSubscription({
    primarySubId: model.activeSub?.id ?? null,
    onError: (message) => {
      setAutoRenew(autoRenewEnabled);
      addToast(message, "error");
    },
  });

  useEffect(() => {
    setAutoRenew(autoRenewEnabled);
  }, [autoRenewEnabled]);

  const openProfileModal = () => {
    const next = new URLSearchParams(searchParams);
    next.set("modal", "profile");
    setSearchParams(next, { replace: true });
  };

  const closeProfileModal = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("modal");
    setSearchParams(next, { replace: true });
  };

  if (model.pageState.status === "empty") {
    return <SessionMissing message={initData ? "Your session expired. Reconnect to continue managing your VPN access." : "Reopen this mini app from Telegram to manage your access."} />;
  }

  if (model.pageState.status === "error") {
    return (
      <FallbackScreen
        title={model.pageState.title ?? "Could not load settings"}
        message={model.pageState.message ?? "Please try again."}
        onRetry={model.pageState.onRetry}
      />
    );
  }

  if (model.pageState.status === "loading") {
    return (
      <PageScaffold>
        <PageHeader
          title={t("settings.header_title")}
          subtitle={t("settings.header_subtitle")}
          onBack={() => navigate("/")}
        />
        <Stack gap="4">
          <Skeleton width="60%" height={18} />
          <Skeleton width="100%" height={72} />
        </Stack>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold>
      <PageHeader
        title={t("settings.header_title")}
        subtitle={t("settings.header_subtitle")}
        onBack={() => navigate("/")}
      />

      <PageSection className="page-section--compact">
        <SettingsAccountOverviewCard
          initial={model.accountSummary.initial}
          name={model.accountSummary.name}
          photoUrl={model.accountSummary.photoUrl}
          eyebrowLabel={t("settings.account_section_title")}
          statusLabel={model.accountStatusLabel}
          renewalLabel={model.accountRenewalLabel}
          renewalValue={model.accountRenewalValue}
          planBadgeLabel={model.hasPlan ? model.planLabel : null}
          planActionTo={model.planActionTo}
          hasPlan={model.hasPlan}
          planCtaLabel={t("plan.cta_choose_plan")}
        />
      </PageSection>

      <PageSection
        id="profile"
        title={t("settings.section_profile")}
        className="page-section--compact"
      >
        <ListCard className="home-card-row module-card settings-list-card">
          <ListRow
            icon={<IconPencil size={15} strokeWidth={2} />}
            iconTone="neutral"
            title={t("settings.edit_profile_title")}
            subtitle={t("settings.edit_profile_description")}
            right={<IconChevronRight size={13} strokeWidth={2.5} />}
            onClick={openProfileModal}
          />
          <SettingsLanguageMenuRow
            open={languageMenuOpen}
            onOpenChange={setLanguageMenuOpen}
            menuId="settings-language-menu"
            menuAriaLabel={t("settings.language_aria")}
            title={t("settings.language_label")}
            description={model.languageSummary}
            activeId={model.languageActiveId}
            options={model.profileLocaleOptions}
            onTriggerClick={() => setLanguageMenuOpen((current) => !current)}
            onSelect={(id) => {
              setLanguageMenuOpen(false);
              model.handleUpdateLocale(id);
            }}
          />
        </ListCard>
      </PageSection>

      <PageSection
        id="plan-management"
        title={t("settings.section_plan_billing")}
        className="page-section--compact"
      >
        <ListCard className="home-card-row module-card settings-list-card">
          <ListRow
            icon={<IconCreditCard size={15} strokeWidth={2} />}
            iconTone="neutral"
            title={model.hasPlan ? t("settings.change_plan_title") : t("plan.cta_choose_plan")}
            subtitle={model.hasPlan ? t("settings.change_plan_description") : t("checkout.header_subtitle")}
            right={<IconChevronRight size={13} strokeWidth={2.5} />}
            onClick={() => navigate(model.planActionTo)}
          />
          <ListRow
            icon={<IconSmartphone size={15} strokeWidth={2} />}
            iconTone="neutral"
            title={t("devices.header_title")}
            subtitle={model.activeDevices.length > 0 ? `${model.deviceCountLabel}. Get the latest config there.` : "Add your first device and get its config."}
            right={<IconChevronRight size={13} strokeWidth={2.5} />}
            onClick={() => navigate(model.devicesActionTo)}
          />
          {model.hasPlan ? (
            <ListRow
              icon={<IconRotateCw size={15} strokeWidth={2} />}
              iconTone="amber"
              title={t("settings.cancel_plan_title")}
              subtitle={model.cancelPlanDescription}
              right={<IconChevronRight size={13} strokeWidth={2.5} />}
              onClick={model.openCancelFlow}
            />
          ) : null}
          <ToggleRow
            name={t("settings.auto_renew_title")}
            description={autoRenewDescription}
            checked={autoRenew}
            className="settings-toggle-row"
            disabled={!model.activeSub || isAutoRenewUpdating}
            disabledReason={!model.activeSub ? t("settings.auto_renew_disabled_reason") : undefined}
            onChange={(next) => {
              setAutoRenew(next);
              updateAutoRenew(next);
            }}
          />
        </ListCard>
      </PageSection>

      <PageSection
        id="support"
        title={t("settings.section_help")}
        className="page-section--compact"
      >
        <ListCard className="home-card-row module-card settings-list-card">
          <ListRow
            icon={<IconShield size={15} strokeWidth={2} />}
            iconTone="neutral"
            title="Setup guide"
            subtitle="Manage devices and review connection instructions."
            right={<IconChevronRight size={13} strokeWidth={2.5} />}
            onClick={() => navigate("/devices")}
          />
          <ListRow
            icon={<IconHelpCircle size={15} strokeWidth={2} />}
            iconTone="neutral"
            title={t("settings.faq_title")}
            subtitle={t("settings.faq_description")}
            right={<IconChevronRight size={13} strokeWidth={2.5} />}
            onClick={() => navigate(model.supportActionTo)}
          />
          <ListRow
            icon={<IconMessageCircle size={15} strokeWidth={2} />}
            iconTone="blue"
            title={t("settings.contact_support_title")}
            subtitle={t("settings.contact_support_description")}
            right={<IconChevronRight size={13} strokeWidth={2.5} />}
            onClick={() => {
              if (supportHref) {
                openLink(supportHref);
              } else {
                addToast("Support link is unavailable", "error");
              }
            }}
          />
        </ListCard>
      </PageSection>

      <PageSection
        id="destructive"
        title={t("settings.danger_section_title")}
        className="page-section--compact settings-danger-section"
      >
        <HelperNote tone="warning">{t("settings.danger_warning")}</HelperNote>
        <ListCard className="home-card-row module-card settings-list-card">
          {model.activeDevices.length > 0 ? (
            <ListRow
              icon={<IconRotateCw size={15} strokeWidth={2} />}
              iconVariant="danger"
              title={t("settings.reset_configs_title")}
              subtitle={t("settings.reset_configs_description")}
              right={<IconChevronRight size={13} strokeWidth={2.5} />}
              onClick={() => !model.isRevoking && model.handleRevokeAll()}
              aria-disabled={model.isRevoking}
            />
          ) : null}
          <ListRow
            icon={<IconCircleX size={15} strokeWidth={2} />}
            iconVariant="danger"
            title={t("settings.logout_title")}
            subtitle={t("settings.logout_description")}
            right={<IconChevronRight size={13} strokeWidth={2.5} />}
            onClick={() => !model.isLoggingOut && model.handleLogout()}
            aria-disabled={model.isLoggingOut}
          />
          <ListRow
            icon={<IconTrash2 size={15} strokeWidth={2} />}
            iconVariant="danger"
            title={t("settings.delete_account_title")}
            subtitle={t("settings.delete_account_description")}
            right={<IconChevronRight size={13} strokeWidth={2.5} />}
            onClick={() => setDeleteAccountOpen(true)}
          />
        </ListCard>
      </PageSection>

      <SubscriptionCancellationModal
        open={model.cancelOpen}
        onClose={() => !model.isCancelling && model.closeCancelFlow()}
        cancelReason={model.cancelReason}
        offers={model.offers}
        isCancelling={model.isCancelling}
        onReasonSelect={model.setCancelReasonWithTrack}
        onPauseInstead={() => model.handleCancelAction({ pause_instead: true, offer_accepted: false })}
        onCancelAtPeriodEnd={() =>
          model.handleCancelAction({
            cancel_at_period_end: true,
            offer_accepted: !!(model.offers?.offer_discount ?? model.offers?.discount_percent),
          })}
        onCancelNow={() =>
          model.handleCancelAction({
            cancel_at_period_end: false,
            offer_accepted: false,
          })}
      />

      <AccountCancellationModal
        open={deleteAccountOpen}
        onClose={() => !model.isDeletingAccount && setDeleteAccountOpen(false)}
        onConfirm={model.handleDeleteAccount}
        loading={model.isDeletingAccount}
      />

      <Modal
        open={profileModalOpen}
        onClose={() => {
          if (!model.isSavingProfile) closeProfileModal();
        }}
        title={t("settings.edit_profile_title")}
        description={t("settings.profile_modal_description")}
        className="settings-profile-modal"
        footer={(
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={closeProfileModal}
              disabled={model.isSavingProfile}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                void model.saveProfile().then(closeProfileModal).catch(() => { });
              }}
              disabled={model.isSavingProfile}
              status={model.isSavingProfile ? "loading" : "idle"}
              statusText="Saving…"
            >
              Save profile
            </Button>
          </>
        )}
      >
        <div className="settings-profile-modal__body">
          <p className="settings-profile-modal__hint">
            {t("settings.profile_modal_hint")}
          </p>
          <Input
            type="text"
            label="Name"
            value={model.profileDisplayName}
            onChange={(event) => model.setProfileDisplayName(event.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
          <Input
            type="email"
            label="Email"
            value={model.profileEmail}
            onChange={(event) => model.setProfileEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Input
            type="tel"
            label="Phone"
            value={model.profilePhone}
            onChange={(event) => model.setProfilePhone(event.target.value)}
            placeholder="+1 234 567 8900"
            autoComplete="tel"
          />
        </div>
      </Modal>

      <FooterHelp
        note="Having trouble?"
        linkLabel="View setup guide"
        onLinkClick={() => navigate("/support")}
      />
    </PageScaffold>
  );
}
