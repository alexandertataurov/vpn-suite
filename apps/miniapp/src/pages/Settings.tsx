import { useEffect, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";
import {
  SessionMissing,
} from "@/components";
import {
  getSupportContactHref,
} from "@/config/env";
import {
  AccountCancellationModal,
  DangerSection,
  FooterHelp,
  PageHeader,
  PageLayout,
  PageScaffold,
  PageSection,
  PlanSection,
  ProfileModal,
  ProfileSection,
  SettingsAccountOverviewCard,
  Skeleton,
  Stack,
  SubscriptionCancellationModal,
  SupportSection,
  useToast,
} from "@/design-system";
import { FallbackScreen } from "@/design-system/patterns/FallbackScreen";
import { useOpenLink, useTelegramWebApp, useUpdateSubscription } from "@/hooks";
import { useI18n } from "@/hooks/useI18n";
import { useSettingsPageModel } from "@/page-models";
import { buildSettingsLegalLinks, getSupportContactDescription } from "@/support/resources";

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
  const supportHref = getSupportContactHref();
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
    return (
      <SessionMissing
        message={
          initData ? t("common.session_expired_message") : t("common.reopen_from_bot_message")
        }
      />
    );
  }

  if (model.pageState.status === "error") {
    return (
      <FallbackScreen
        title={model.pageState.title ?? t("common.could_not_load_settings_title")}
        message={model.pageState.message ?? t("common.please_try_again")}
        onRetry={model.pageState.onRetry}
      />
    );
  }

  if (model.pageState.status === "loading") {
    return (
      <PageScaffold>
        <PageLayout scrollable={false}>
          <PageHeader
            title={t("settings.header_title")}
            subtitle={t("settings.header_subtitle")}
            onBack={() => navigate("/")}
            backAriaLabel={t("common.back_aria")}
          />
          <Stack gap="2">
            <Skeleton width="60%" height={18} />
            <Skeleton width="100%" height={72} />
          </Stack>
        </PageLayout>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold>
      <PageLayout scrollable={false}>
      <PageHeader
        title={t("settings.header_title")}
        subtitle={t("settings.header_subtitle")}
        onBack={() => navigate("/")}
        backAriaLabel={t("common.back_aria")}
      />

      <PageSection compact>
        <SettingsAccountOverviewCard
          name={model.accountSummary.name}
          initials={
            model.accountSummary.name
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase() ||
            model.accountSummary.initial.toUpperCase().padEnd(2, model.accountSummary.initial)
          }
          planName={model.planLabel}
          planStatus={
            model.hasPlan
              ? (model.renewalDays ?? 0) > 7
                ? "active"
                : (model.renewalDays ?? 0) <= 0
                  ? "expired"
                  : "expiring"
              : "expired"
          }
          renewalDate={model.accountRenewalValue ?? model.accountRenewalLabel ?? "—"}
          devicesUsed={model.activeDevices.length}
          devicesTotal={model.activeSub?.device_limit ?? null}
          onEdit={() => navigate(model.planActionTo)}
        />
      </PageSection>

      <ProfileSection
        sectionTitle={t("settings.section_profile")}
        editProfileTitle={t("settings.edit_profile_title")}
        editProfileDescription={t("settings.edit_profile_description")}
        onEditProfile={openProfileModal}
        languageMenuOpen={languageMenuOpen}
        onLanguageMenuChange={setLanguageMenuOpen}
        menuId="settings-language-menu"
        menuAriaLabel={t("settings.language_aria")}
        languageLabel={t("settings.language_label")}
        languageSummary={model.languageSummary}
        languageActiveId={model.languageActiveId}
        localeOptions={model.profileLocaleOptions}
        onLocaleSelect={(id) => {
          setLanguageMenuOpen(false);
          model.handleUpdateLocale(id);
        }}
      />

      <PlanSection
        sectionTitle={t("settings.section_plan_billing")}
        hasPlan={model.hasPlan}
        planTitle={model.hasPlan ? t("settings.change_plan_title") : t("plan.cta_choose_plan")}
        planDescription={model.hasPlan ? t("settings.change_plan_description") : t("checkout.header_subtitle")}
        onPlanClick={() => navigate(model.planActionTo)}
        devicesTitle={t("devices.header_title")}
        devicesSubtitle={
          model.activeDevices.length > 0
            ? t("settings.devices_row_subtitle_active", { count: model.deviceCountLabel })
            : t("settings.devices_row_subtitle_empty")
        }
        onDevicesClick={() => navigate(model.devicesActionTo)}
        cancelPlanTitle={t("settings.cancel_plan_title")}
        cancelPlanDescription={model.cancelPlanDescription}
        onCancelClick={model.openCancelFlow}
        autoRenewTitle={t("settings.auto_renew_title")}
        autoRenewDescription={autoRenewDescription}
        autoRenewChecked={autoRenew}
        autoRenewDisabled={!model.activeSub || isAutoRenewUpdating}
        autoRenewDisabledReason={!model.activeSub ? t("settings.auto_renew_disabled_reason") : undefined}
        onAutoRenewChange={(next) => {
          setAutoRenew(next);
          updateAutoRenew(next);
        }}
      />

      <SupportSection
        sectionTitle={t("settings.section_help")}
        setupGuideTitle={t("settings.setup_guide_title")}
        setupGuideDescription={t("settings.setup_guide_description")}
        onSetupGuideClick={() => navigate("/connect-status")}
        faqTitle={t("settings.faq_title")}
        faqDescription={t("settings.faq_description")}
        onFaqClick={() => navigate(model.supportActionTo)}
        legalLinks={buildSettingsLegalLinks({ t, openLink })}
        contactSupportTitle={t("settings.contact_support_title")}
        contactSupportDescription={getSupportContactDescription(t)}
        onContactSupportClick={() => {
          if (supportHref) {
            openLink(supportHref);
          } else {
            addToast(t("settings.support_unavailable"), "error");
          }
        }}
      />

      <DangerSection
        sectionTitle={t("settings.danger_section_title")}
        warningText={t("settings.danger_warning")}
        hasActiveDevices={model.activeDevices.length > 0}
        resetConfigsTitle={t("settings.reset_configs_title")}
        resetConfigsDescription={t("settings.reset_configs_description")}
        onResetConfigs={model.handleRevokeAll}
        isRevoking={model.isRevoking}
        logoutTitle={t("settings.logout_title")}
        logoutDescription={t("settings.logout_description")}
        onLogout={model.handleLogout}
        isLoggingOut={model.isLoggingOut}
        deleteAccountTitle={t("settings.delete_account_title")}
        deleteAccountDescription={t("settings.delete_account_description")}
        onDeleteAccount={() => setDeleteAccountOpen(true)}
      />

      <SubscriptionCancellationModal
        isOpen={model.cancelOpen}
        onClose={() => !model.isCancelling && model.closeCancelFlow()}
        cancelReason={model.cancelReason}
        offers={model.offers}
        isCancelling={model.isCancelling}
        onReasonSelect={model.setCancelReasonWithTrack}
        cancelFreeText={model.cancelFreeText}
        onCancelFreeTextChange={model.setCancelFreeText}
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
        isOpen={deleteAccountOpen}
        onClose={() => !model.isDeletingAccount && setDeleteAccountOpen(false)}
        onConfirm={model.handleDeleteAccount}
        loading={model.isDeletingAccount}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={closeProfileModal}
        title={t("settings.edit_profile_title")}
        description={t("settings.profile_modal_description")}
        hintText={t("settings.profile_modal_hint")}
        nameLabel={t("settings.field_name")}
        nameValue={model.profileDisplayName}
        namePlaceholder={t("settings.field_name_placeholder")}
        onNameChange={model.setProfileDisplayName}
        emailLabel={t("settings.field_email")}
        emailValue={model.profileEmail}
        emailPlaceholder={t("settings.field_email_placeholder")}
        onEmailChange={model.setProfileEmail}
        phoneLabel={t("settings.field_phone")}
        phoneValue={model.profilePhone}
        phonePlaceholder={t("settings.field_phone_placeholder")}
        onPhoneChange={model.setProfilePhone}
        cancelLabel={t("common.cancel")}
        saveLabel={t("settings.save_profile")}
        onCancel={closeProfileModal}
        onSave={() => void model.saveProfile().then(closeProfileModal).catch(() => {})}
        isSaving={model.isSavingProfile}
        savingLabel={t("settings.saving")}
      />

      <FooterHelp
        note={t("footer.having_trouble")}
        linkLabel={t("footer.view_setup_guide")}
        onLinkClick={() => navigate("/support")}
      />
      </PageLayout>
    </PageScaffold>
  );
}
