import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@vpn-suite/shared";
import { postAuth } from "@/api";
import { setWebappToken } from "@/api/client";
import { AccountCancellationModal, SessionMissing, SettingsAccountOverviewCard, SettingsLanguageMenuRow, SettingsReconnectCard, SubscriptionCancellationModal } from "@/components";
import {
  Button,
  ButtonRow,
  ConfirmDanger,
  DataCell,
  DataGrid,
  FallbackScreen,
  FormField,
  IconAlertTriangle,
  IconCreditCard,
  IconLock,
  IconMessageCircle,
  IconTrash2,
  IconUsers,
  MissionAlert,
  MissionSecondaryButton,
  Modal,
  PageCardSection,
  PageFrame,
  PageSection,
  SettingsCard,
  SettingsActionRow,
  SettingsDivider,
  Skeleton,
  SupportActionList,
  useToast,
} from "@/design-system";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
import { useSettingsPageModel } from "@/page-models";
import { useI18n } from "@/hooks/useI18n";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";

export function SettingsPage() {
  const { impact } = useTelegramHaptics();
  const model = useSettingsPageModel();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { initData } = useTelegramWebApp();
  const { addToast } = useToast();
  const [profileEditing, setProfileEditing] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [resetConfigsOpen, setResetConfigsOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const buildInfoPressTimer = useRef<number | null>(null);
  const discountPercent = model.offers?.discount_percent;
  const cancelOpen = model.cancelOpen;
  const track = model.track;
  const languageActiveId =
    model.profileLocale === model.effectiveTelegramLocale ? "auto" : model.profileLocale;

  useEffect(() => {
    if (cancelOpen && discountPercent && discountPercent > 0) {
      track("retention_offer_shown", { discount_percent: discountPercent });
    }
  }, [cancelOpen, discountPercent, track]);

  useEffect(() => {
    return () => {
      if (buildInfoPressTimer.current != null) {
        window.clearTimeout(buildInfoPressTimer.current);
      }
    };
  }, []);

  if (model.pageState.status === "empty") {
    if (!initData) {
      return <SessionMissing message={t("settings.logged_out_message")} />;
    }

    return (
      <PageFrame title={t("settings.header_title")} className="page-shell--dense page-shell--sectioned">
        <PageSection id="logged-out-section" className="page-section--compact settings-account-section">
          <SettingsReconnectCard
            title={t("settings.logged_out_title")}
            message={t("settings.logged_out_message")}
            ctaLabel={t("settings.logged_out_cta")}
            loadingLabel={t("onboarding.loading")}
            reconnecting={reconnecting}
            onReconnect={() => {
              setReconnecting(true);
              postAuth(initData)
                .then((res) => {
                  setWebappToken(res.session_token, res.expires_in);
                  queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
                })
                .catch((err) => {
                  addToast(err instanceof ApiError ? err.message : t("common.could_not_reconnect"), "error");
                })
                .finally(() => setReconnecting(false));
            }}
          />
        </PageSection>
      </PageFrame>
    );
  }

  if (model.pageState.status === "error") {
    return (
      <FallbackScreen
        title={model.pageState.title ?? t("common.could_not_load_title")}
        message={model.pageState.message ?? t("common.could_not_load_settings")}
        onRetry={model.pageState.onRetry}
      />
    );
  }

  if (model.pageState.status === "loading") {
    return (
      <PageFrame title={model.header.title} className="page-shell--dense page-shell--sectioned">
        <PageSection id="account-section" className="page-section--compact settings-account-section">
          <SettingsCard className="module-card settings-account-card">
            <div className="settings-account-banner settings-account-banner--loading">
              <Skeleton width={40} height={40} className="settings-account-avatar-skeleton" />
              <div className="settings-account-banner__copy">
                <Skeleton width="48%" height={16} />
                <Skeleton width="72%" height={13} />
                <Skeleton width="44%" height={13} />
              </div>
            </div>
            <DataGrid columns={2}>
              <DataCell label={t("settings.account_overview_plan_key")} value="" loading />
              <DataCell label={t("settings.account_overview_devices_key")} value="" loading />
              <DataCell label={t("settings.renews_on_label")} value="" loading />
              <DataCell label={t("settings.language_label")} value="" loading />
            </DataGrid>
          </SettingsCard>
        </PageSection>
        <PageSection id="app-section" title={t("settings.section_preferences")} className="page-section--compact">
          <SettingsCard className="module-card settings-list-card">
            <Skeleton className="settings-row-skeleton" />
          </SettingsCard>
        </PageSection>
      </PageFrame>
    );
  }

  return (
    <PageFrame
      title={model.header.title}
      className="page-shell--dense page-shell--sectioned"
    >
      <PageSection id="account-section" className="stagger-1 page-section--compact settings-account-section">
        <SettingsAccountOverviewCard
          initial={model.accountSummary.initial}
          name={model.accountSummary.name}
          hasPlan={model.hasPlan}
          planLabel={model.planLabel}
          renewalCountdownLabel={model.renewalCountdownLabel}
          deviceCountLabel={model.deviceCountLabel}
          planActionTo={model.planActionTo}
          noPlanLabel={t("settings.banner_no_plan_title")}
          planCtaLabel={t("settings.plan_cta_cell")}
          renewalDateValue={model.renewalDate ?? "--"}
          languageLabel={t("settings.language_label")}
          languageValue={model.languageSummary}
          overviewPlanLabel={t("settings.account_overview_plan_key")}
          overviewDevicesLabel={t("settings.account_overview_devices_key")}
          overviewRenewsLabel={t("settings.renews_on_label")}
        />
      </PageSection>

      <PageSection id="app-section" title={t("settings.section_preferences")} className="stagger-2 page-section--compact">
        <SettingsCard className="module-card settings-list-card">
          <SettingsLanguageMenuRow
            open={languageMenuOpen}
            onOpenChange={setLanguageMenuOpen}
            menuId="settings-language-menu"
            menuAriaLabel={t("settings.language_aria")}
            title={t("settings.language_label")}
            description={t("settings.language_helper")}
            value={model.languageSummary}
            activeId={languageActiveId}
            options={model.profileLocaleOptions}
            onTriggerClick={() => {
              impact("light");
              setLanguageMenuOpen((open) => !open);
            }}
            onSelect={(id) => {
              impact("light");
              model.setProfileLocale(id);
              model.handleUpdateLocale(id);
              setLanguageMenuOpen(false);
            }}
          />
        </SettingsCard>
      </PageSection>

      <PageSection id="actions-section" title={t("settings.section_account_links")} className="stagger-3 page-section--compact">
        <SettingsCard className="module-card settings-quick-actions-card">
          <div className="settings-quick-actions">
            <SupportActionList
              className="settings-quick-actions__list quick-action-grid"
              items={[
                {
                  to: "/referral",
                  title: t("settings.account_links_referral_title"),
                  description: model.referralSummary,
                  icon: <IconUsers size={16} strokeWidth={1.6} />,
                },
                {
                  to: "/plan",
                  title: t("settings.account_links_plan_title"),
                  description: model.hasPlan && model.renewalDate
                    ? `${t("settings.account_links_plan_description")} · ${model.renewalDate}`
                    : t("settings.account_links_plan_description"),
                  icon: <IconCreditCard size={16} strokeWidth={1.6} />,
                },
                {
                  to: "/support",
                  title: t("settings.account_links_support_title"),
                  description: t("settings.account_links_support_description"),
                  icon: <IconMessageCircle size={16} strokeWidth={1.6} />,
                },
              ]}
              onItemClick={() => impact("light")}
            />
          </div>
        </SettingsCard>

        <SettingsCard className="module-card settings-list-card">
          <SettingsActionRow
            icon={<IconUsers size={20} strokeWidth={1.6} />}
            title={t("settings.profile_menu_edit")}
            description={t("settings.profile_card_description")}
            onClick={() => {
              impact("light");
              setProfileEditing(true);
            }}
          />
        </SettingsCard>
      </PageSection>

      <PageSection
        id="subscription-section"
        title={t("settings.subscription_section_title")}
        description={t("settings.subscription_section_description")}
        className="stagger-3 page-section--compact"
      >
        <SettingsCard className="module-card settings-list-card">
          {model.offers && !model.offersError && (model.offers.can_pause || model.offers.can_resume) ? (
            <>
              <SettingsActionRow
                icon={<IconCreditCard size={20} strokeWidth={1.6} />}
                title={model.offers.can_pause ? t("settings.pause_subscription") : t("settings.resume_subscription")}
                description={t("settings.subscription_section_description")}
                onClick={() => {
                  impact("light");
                  if (model.offers?.can_pause) {
                    model.handlePause();
                  } else {
                    model.handleResume();
                  }
                }}
              />
              <SettingsDivider />
            </>
          ) : null}

        </SettingsCard>
      </PageSection>

      <PageSection
        id="session-section"
        title={t("settings.session_section_title")}
        className="stagger-5 page-section--compact settings-danger-section"
      >
        <SettingsCard className="module-card settings-list-card">
          <SettingsActionRow
            icon={<IconLock size={20} strokeWidth={1.6} />}
            title={t("settings.logout_title")}
            description={t("settings.logout_description")}
            onClick={() => {
              impact("light");
              model.handleLogout();
            }}
            buttonProps={{ disabled: model.isLoggingOut }}
          />
        </SettingsCard>
      </PageSection>

      <PageSection
        id="danger-section"
        title={t("settings.danger_section_title")}
        className="stagger-6 page-section--compact settings-danger-section"
      >
        {model.activeDevices.length > 0 || (model.offers && !model.offersError) ? (
          <SettingsCard className="module-card settings-list-card">
            {model.activeDevices.length > 0 ? (
              <SettingsActionRow
                icon={<IconAlertTriangle size={20} strokeWidth={1.6} />}
                title={t("settings.reset_configs_menu_title")}
                description={t("settings.reset_configs_menu_description")}
                tone="warning"
                onClick={() => {
                  impact("light");
                  setResetConfigsOpen(true);
                }}
              />
            ) : null}
            {model.activeDevices.length > 0 && model.offers && !model.offersError ? <SettingsDivider /> : null}
            {model.offers && !model.offersError ? (
              <SettingsActionRow
                icon={<IconCreditCard size={20} strokeWidth={1.6} />}
                title={t("settings.cancel_subscription")}
                description={
                  model.renewalDate
                    ? t("settings.subscription_access_until", { date: model.renewalDate })
                    : t("settings.subscription_section_description")
                }
                tone="warning"
                onClick={() => {
                  impact("light");
                  model.openCancelFlow();
                }}
              />
            ) : null}
          </SettingsCard>
        ) : null}

        {model.pageState.status === "ready" ? (
          <SettingsCard className="module-card settings-list-card">
            <SettingsActionRow
              icon={<IconTrash2 size={20} strokeWidth={1.6} />}
              title={t("settings.profile_menu_delete")}
              description={t("settings.delete_account_confirm_message")}
              tone="danger"
              onClick={() => {
                impact("light");
                setDeleteAccountOpen(true);
              }}
            />
          </SettingsCard>
        ) : null}
      </PageSection>

      {model.offersLoading ? (
        <PageCardSection cardClassName="module-card settings-loading-card">
          <Skeleton className="skeleton-h-md" />
          <Skeleton className="skeleton-h-sm" />
        </PageCardSection>
      ) : null}
      {model.offersError ? (
        <PageCardSection cardTone="red">
          <MissionAlert
            tone="error"
            title={t("settings.offers_unavailable_title")}
            message={t("settings.offers_unavailable_message")}
          />
          <ButtonRow>
            <MissionSecondaryButton onClick={model.refetchOffers}>
              {t("settings.offers_try_again")}
            </MissionSecondaryButton>
          </ButtonRow>
        </PageCardSection>
      ) : null}

      <div
        className="settings-build-footer"
        role="button"
        tabIndex={0}
        aria-label={t("settings.build_info_copy_aria")}
        onContextMenu={(event) => {
          event.preventDefault();
          void model.copyBuildInfo();
        }}
        onPointerDown={() => {
          buildInfoPressTimer.current = window.setTimeout(() => {
            void model.copyBuildInfo();
            buildInfoPressTimer.current = null;
          }, 600);
        }}
        onPointerUp={() => {
          if (buildInfoPressTimer.current != null) {
            window.clearTimeout(buildInfoPressTimer.current);
            buildInfoPressTimer.current = null;
          }
        }}
        onPointerCancel={() => {
          if (buildInfoPressTimer.current != null) {
            window.clearTimeout(buildInfoPressTimer.current);
            buildInfoPressTimer.current = null;
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            void model.copyBuildInfo();
          }
        }}
      >
        <div>{model.buildLabel}</div>
        <div>{model.buildProtocolLabel}</div>
      </div>

      <Modal
        open={profileEditing}
        onClose={() => !model.isSavingProfile && setProfileEditing(false)}
        title={t("settings.profile_card_title_editing")}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setProfileEditing(false)}
              disabled={model.isSavingProfile}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                model.saveProfile();
                setProfileEditing(false);
              }}
              disabled={model.isSavingProfile}
            >
              {model.isSavingProfile ? t("onboarding.loading") : t("settings.save_profile")}
            </Button>
          </>
        }
      >
        <FormField
          label={t("settings.field_name")}
          input={
            <input
              type="text"
              className="input field-input"
              value={model.profileDisplayName}
              onChange={(e) => model.setProfileDisplayName(e.target.value)}
              placeholder={t("settings.field_name_placeholder")}
              aria-label={t("settings.field_name_aria")}
            />
          }
        />
        <SettingsDivider />
        <FormField
          label={t("settings.field_email")}
          input={
            <input
              type="email"
              className="input field-input"
              value={model.profileEmail}
              onChange={(e) => model.setProfileEmail(e.target.value)}
              placeholder={t("settings.field_email_placeholder")}
              aria-label={t("settings.field_email")}
            />
          }
        />
        <SettingsDivider />
        <FormField
          label={t("settings.field_phone")}
          input={
            <input
              type="tel"
              className="input field-input"
              value={model.profilePhone}
              onChange={(e) => model.setProfilePhone(e.target.value)}
              placeholder={t("settings.field_phone_placeholder")}
              aria-label={t("settings.field_phone")}
            />
          }
        />
      </Modal>

      <ConfirmDanger
        open={resetConfigsOpen}
        onClose={() => !model.isRevoking && setResetConfigsOpen(false)}
        title={t("settings.danger_reset_confirm_title")}
        message={t("settings.danger_reset_confirm_message")}
        confirmLabel={t("settings.danger_reset_confirm_label")}
        cancelLabel={t("settings.danger_reset_cancel_label")}
        confirmTokenRequired
        confirmTokenLabel={t("settings.danger_reset_token_label")}
        expectedConfirmValue="RESET"
        onConfirm={() => model.handleRevokeAll()}
        loading={model.isRevoking}
      />

      <AccountCancellationModal
        open={deleteAccountOpen}
        onClose={() => !model.isDeletingAccount && setDeleteAccountOpen(false)}
        onConfirm={model.handleDeleteAccount}
        loading={model.isDeletingAccount}
      />

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
    </PageFrame>
  );
}
