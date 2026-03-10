import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { AccountSummaryHero, SessionMissing } from "@/components";
import {
  Button,
  ButtonRow,
  ConfirmDanger,
  FallbackScreen,
  FormField,
  IconAlertTriangle,
  IconCreditCard,
  IconGlobe,
  IconUsers,
  MissionAlert,
  MissionCard,
  MissionPrimaryButton,
  MissionSecondaryButton,
  Modal,
  PageCardSection,
  PageFrame,
  PageHeaderBadge,
  PageSection,
  Popover,
  SettingsCard,
  SettingsDivider,
  Skeleton,
} from "@/design-system";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";
import { useSettingsPageModel } from "@/page-models";
import { useI18n } from "@/hooks/useI18n";

interface SettingsRowProps {
  icon: ReactNode;
  title: string;
  description: string;
  value?: string;
  danger?: boolean;
  onClick: () => void;
  buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}

function SettingsRow({
  icon,
  title,
  description,
  value,
  danger = false,
  onClick,
  buttonProps,
}: SettingsRowProps) {
  return (
    <button
      type="button"
      className={`settings-list-row ${danger ? "settings-list-row--danger" : ""}`}
      onClick={onClick}
      {...buttonProps}
    >
      <span className="settings-list-row__icon" aria-hidden>
        {icon}
      </span>
      <span className="settings-list-row__body">
        <span className="settings-list-row__title">{title}</span>
        <span className="settings-list-row__description">{description}</span>
      </span>
      {value ? <span className="settings-list-row__value">{value}</span> : null}
      <span className="settings-list-row__action" aria-hidden>{">"}</span>
    </button>
  );
}

export function SettingsPage() {
  const { impact } = useTelegramHaptics();
  const model = useSettingsPageModel();
  const { t } = useI18n();
  const [profileEditing, setProfileEditing] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [resetConfigsOpen, setResetConfigsOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const discountPercent = model.offers?.discount_percent;
  const cancelOpen = model.cancelOpen;
  const track = model.track;
  const languageActiveId =
    model.profileLocale === model.effectiveTelegramLocale ? "auto" : model.profileLocale;
  const languageSummary =
    model.profileLocaleOptions.find((option) => option.id === languageActiveId)?.label ??
    t("settings.language_auto");

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
        title={model.pageState.title ?? t("common.could_not_load_title")}
        message={model.pageState.message ?? t("common.could_not_load_settings")}
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
      subtitle={model.header.subtitle}
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
      >
        <div className="settings-hero-meta" aria-label={t("settings.header_title")}>
          <span className="settings-hero-meta-item">
            {t("settings.account_overview_plan_key")}: {model.planLabel}
          </span>
          <span className="settings-hero-meta-item">
            {t("settings.account_overview_devices_key")}: {model.activeDevices.length} {t("settings.account_overview_devices_active_suffix")}
          </span>
          <span className="settings-hero-meta-item">
            {t("settings.language_label")}: {languageSummary}
          </span>
        </div>
      </AccountSummaryHero>

      <PageSection id="preferences-section" title={t("settings.section_preferences")} className="stagger-2 settings-section">
        <SettingsCard className="settings-page module-card settings-list-card">
          <Popover
            open={languageMenuOpen}
            onOpenChange={setLanguageMenuOpen}
            id="settings-language-menu"
            panelClassName="miniapp-popover-panel--menu"
            panelAriaLabel={t("settings.language_aria")}
            renderTrigger={(triggerProps) => (
              <SettingsRow
                icon={<IconGlobe size={20} strokeWidth={1.6} />}
                title={t("settings.language_label")}
                description={t("settings.language_helper")}
                value={languageSummary}
                onClick={() => {
                  impact("light");
                  setLanguageMenuOpen((open) => !open);
                }}
                buttonProps={triggerProps}
              />
            )}
          >
            <ul className="miniapp-menu-list settings-context-list" role="menu" aria-label={t("settings.language_aria")}>
              {model.profileLocaleOptions.map((option) => (
                <li key={option.id} role="none">
                  <Button
                    type="button"
                    role="menuitemradio"
                    aria-checked={languageActiveId === option.id}
                    variant="ghost"
                    size="sm"
                    className={`miniapp-menu-item settings-context-item ${
                      languageActiveId === option.id ? "settings-context-item--active" : ""
                    }`}
                    onClick={() => {
                      impact("light");
                      model.setProfileLocale(option.id);
                      model.handleUpdateLocale(option.id);
                      setLanguageMenuOpen(false);
                    }}
                  >
                    <span className="miniapp-menu-item-text">
                      <span className="miniapp-menu-item-title">{option.label}</span>
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </Popover>
        </SettingsCard>
      </PageSection>

      <PageSection id="actions-section" title={t("settings.section_account_links")} className="stagger-3 settings-section">
        <SettingsCard className="settings-page module-card settings-list-card">
          <SettingsRow
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
        className="stagger-3 settings-section"
      >
        <SettingsCard className="settings-page module-card settings-list-card">
          {model.offers && !model.offersError && (model.offers.can_pause || model.offers.can_resume) ? (
            <>
              <SettingsRow
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

          {model.offers && !model.offersError ? (
            <>
              <SettingsRow
                icon={<IconCreditCard size={20} strokeWidth={1.6} />}
                title={t("settings.cancel_subscription")}
                description={t("settings.cancel_modal_description")}
                danger
                onClick={() => {
                  impact("light");
                  model.openCancelFlow();
                }}
              />
              {model.activeDevices.length > 0 ? <SettingsDivider /> : null}
            </>
          ) : null}

          {model.activeDevices.length > 0 ? (
            <>
              <SettingsRow
                icon={<IconAlertTriangle size={20} strokeWidth={1.6} />}
                title={t("settings.reset_configs_menu_title")}
                description={t("settings.reset_configs_menu_description")}
                danger
                onClick={() => {
                  impact("light");
                  setResetConfigsOpen(true);
                }}
              />
              <SettingsDivider />
            </>
          ) : null}

          {model.pageState.status === "ready" ? (
            <SettingsRow
              icon={<IconAlertTriangle size={20} strokeWidth={1.6} />}
              title={t("settings.profile_menu_delete")}
              description={t("settings.delete_account_confirm_message")}
              danger
              onClick={() => {
                impact("light");
                setDeleteAccountOpen(true);
              }}
            />
          ) : null}
        </SettingsCard>
      </PageSection>

      {model.offersLoading ? (
        <MissionCard tone="blue" className="module-card settings-loading-card">
          <Skeleton className="skeleton-h-md" />
          <Skeleton className="skeleton-h-sm" />
        </MissionCard>
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

      <ConfirmDanger
        open={deleteAccountOpen}
        onClose={() => !model.isDeletingAccount && setDeleteAccountOpen(false)}
        title={t("settings.delete_account_confirm_title")}
        message={t("settings.delete_account_confirm_message")}
        confirmLabel={t("settings.delete_account_confirm_label")}
        cancelLabel={t("settings.delete_account_cancel_label")}
        confirmTokenRequired
        confirmTokenLabel={t("settings.delete_account_token_label")}
        expectedConfirmValue="DELETE"
        onConfirm={(payload) => model.handleDeleteAccount(payload.confirm_token ?? "")}
        loading={model.isDeletingAccount}
      />

      <Modal
        open={model.cancelOpen}
        onClose={() => !model.isCancelling && model.setCancelOpen(false)}
        title={t("settings.cancel_modal_title")}
        description={t("settings.cancel_modal_description")}
        footer={
          <Button
            type="button"
            variant="ghost"
            onClick={() => !model.isCancelling && model.setCancelOpen(false)}
          >
            {t("settings.cancel_modal_keep")}
          </Button>
        }
      >
        <div className="cancel-flow-body">
          <div className="field-group">
            <div className="field-label">{t("settings.cancel_reason_label")}</div>
            <div className="seg-toggle" role="tablist" aria-label={t("settings.cancel_reason_label")}>
              {[
                { id: "price", label: t("settings.cancel_reason_price") },
                { id: "not_needed", label: t("settings.cancel_reason_not_needed") },
                { id: "technical", label: t("settings.cancel_reason_technical") },
                { id: "other", label: t("settings.cancel_reason_other") },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`seg-btn ${model.cancelReason === option.id ? "on" : ""}`}
                  onClick={() => model.setCancelReasonWithTrack(option.id as typeof model.cancelReason)}
                  role="tab"
                  aria-selected={model.cancelReason === option.id}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {model.offers && (model.offers.offer_discount || (model.offers.discount_percent ?? 0) > 0) ? (
            <p className="modal-message type-body-sm">
              {t("settings.cancel_loyalty_offer", { percent: model.offers.discount_percent ?? 0 })}
            </p>
          ) : null}
          {model.offers?.offer_downgrade ? (
            <p className="modal-message type-body-sm">{t("settings.cancel_downgrade_hint")}</p>
          ) : null}
          <ButtonRow className="cancel-flow-actions">
            {(model.offers?.offer_pause ?? model.offers?.can_pause) ? (
              <MissionSecondaryButton
                onClick={() => model.handleCancelAction({ pause_instead: true, offer_accepted: false })}
                disabled={model.isCancelling}
              >
                {model.isCancelling ? "…" : t("settings.cancel_pause_instead")}
              </MissionSecondaryButton>
            ) : null}
            <MissionSecondaryButton
              onClick={() =>
                model.handleCancelAction({
                  cancel_at_period_end: true,
                  offer_accepted: !!(model.offers?.offer_discount ?? model.offers?.discount_percent),
                })
              }
              disabled={model.isCancelling}
            >
              {model.isCancelling ? "…" : t("settings.cancel_at_period_end")}
            </MissionSecondaryButton>
            <MissionPrimaryButton
              tone="danger"
              onClick={() =>
                model.handleCancelAction({
                  cancel_at_period_end: false,
                  offer_accepted: false,
                })
              }
              disabled={model.isCancelling}
            >
              {model.isCancelling ? "…" : t("settings.cancel_now")}
            </MissionPrimaryButton>
          </ButtonRow>
        </div>
      </Modal>
    </PageFrame>
  );
}
