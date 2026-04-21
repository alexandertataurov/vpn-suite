import { DataCell, DataGrid } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";

export interface CheckoutSummaryCardProps {
  planDisplayName: string;
  showConfirmation: boolean;
  planDurationDays: number | null | undefined;
  planDeviceLimit: number;
  priceLabel: string;
  originalPriceLabel?: string | null;
}

export function CheckoutSummaryCard({
  planDisplayName,
  showConfirmation,
  planDurationDays,
  planDeviceLimit,
  priceLabel,
  originalPriceLabel,
}: CheckoutSummaryCardProps) {
  const { t } = useI18n();
  const gridColumns = showConfirmation ? 1 : 2;

  return (
    <DataGrid columns={gridColumns}>
      <DataCell label={t("checkout.grid_key_plan")} value={planDisplayName} cellType="plan" />
      <DataCell
        label={t("checkout.grid_key_price")}
        value={
          originalPriceLabel
            ? t("checkout.price_with_discount", { discounted: priceLabel, original: originalPriceLabel })
            : priceLabel
        }
      />
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
          <DataCell label={t("checkout.grid_key_renewal")} value={t("checkout.renewal_auto")} />
        </>
      ) : (
        <DataCell label={t("checkout.grid_key_mode")} value={t("checkout.mode_activation")} />
      )}
    </DataGrid>
  );
}
