import type { ReactNode } from "react";
import { DataCell, DataGrid, StarsAmount } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";

export interface CheckoutSummaryCardProps {
  planDisplayName: string;
  planPriceStars: number | null;
  promoStatus: "idle" | "validating" | "valid" | "invalid";
  discountedPriceXtr: number | null;
  showConfirmation: boolean;
  planDurationDays: number | null | undefined;
  planDeviceLimit: number;
  isFreePlan: boolean;
}

export function CheckoutSummaryCard({
  planDisplayName,
  planPriceStars,
  promoStatus,
  discountedPriceXtr,
  showConfirmation,
  planDurationDays,
  planDeviceLimit,
  isFreePlan,
}: CheckoutSummaryCardProps) {
  const { t } = useI18n();

  let priceValue: ReactNode = null;
  if (planPriceStars != null) {
    priceValue = (
      <span className="teal miniapp-tnum">
        {promoStatus === "valid" && discountedPriceXtr != null ? (
          <span className="price-summary">
            <StarsAmount value={planPriceStars} className="price-original" />
            <StarsAmount value={discountedPriceXtr} className="price-discounted" />
          </span>
        ) : (
          <StarsAmount value={planPriceStars} />
        )}
      </span>
    );
  }

  return (
    <DataGrid columns={2}>
      <DataCell label={t("checkout.grid_key_plan")} value={planDisplayName} cellType="plan" />
      {priceValue ? (
        <DataCell
          label={t("checkout.grid_key_price")}
          value={priceValue}
          valueTone="teal"
        />
      ) : null}
      {showConfirmation ? (
        <>
          <DataCell
            label={t("checkout.grid_key_duration")}
            value={t("checkout.duration_days", { days: planDurationDays ?? 0 })}
          />
          <DataCell
            label={t("checkout.grid_key_devices")}
            value={`${planDeviceLimit} ${
              planDeviceLimit !== 1
                ? t("devices.section_devices_title").toLowerCase()
                : t("devices.summary_eyebrow").toLowerCase()
            }`}
          />
          <DataCell label={t("checkout.grid_key_renewal")} value={t("plan.renewal_strip_title")} />
        </>
      ) : (
        <DataCell
          label={t("checkout.grid_key_mode")}
          value={isFreePlan ? t("checkout.mode_activation") : t("checkout.mode_stars_payment")}
        />
      )}
    </DataGrid>
  );
}
