import type { ReactNode } from "react";
import {
  CardFooterLink,
  ListCard,
  ListRow,
  StatusChip,
  type ListRowIconTone,
  type StatusChipVariant,
} from "@/design-system";

export interface BillingHistoryItemView {
  id: string;
  icon: ReactNode;
  iconTone: ListRowIconTone;
  title: ReactNode;
  subtitle: ReactNode;
  amount: ReactNode;
  statusLabel: ReactNode;
  statusVariant: StatusChipVariant;
}

export interface BillingHistoryCardProps {
  title?: ReactNode;
  items: BillingHistoryItemView[];
  loading?: boolean;
  errorMessage?: ReactNode | null;
  emptyMessage?: ReactNode;
  footerLabel?: ReactNode;
  footerDisabled?: boolean;
  onFooterClick?: () => void;
  className?: string;
}

export function BillingHistoryCard({
  title = "Recent Transactions",
  items,
  loading,
  errorMessage,
  emptyMessage = "No transactions yet.",
  footerLabel,
  footerDisabled,
  onFooterClick,
  className = "",
}: BillingHistoryCardProps) {
  return (
    <ListCard title={title} className={`billing-history-card ${className}`.trim()}>
      {loading ? (
        <div className="billing-history-loading">
          <div className="billing-history-skeleton-line" />
          <div className="billing-history-skeleton-line" />
        </div>
      ) : errorMessage ? (
        <div className="billing-history-empty">{errorMessage}</div>
      ) : items.length === 0 ? (
        <div className="billing-history-empty">{emptyMessage}</div>
      ) : (
        items.map((item) => (
          <ListRow
            key={item.id}
            icon={item.icon}
            iconTone={item.iconTone}
            title={item.title}
            subtitle={item.subtitle}
            subtitleMono
            rightColumn
            right={
              <div className="billing-history-right">
                <div className="billing-history-amount miniapp-tnum">{item.amount}</div>
                <StatusChip variant={item.statusVariant}>{item.statusLabel}</StatusChip>
              </div>
            }
          />
        ))
      )}
      {footerLabel != null ? (
        <CardFooterLink disabled={footerDisabled} onClick={onFooterClick}>
          {footerLabel}
        </CardFooterLink>
      ) : null}
    </ListCard>
  );
}
