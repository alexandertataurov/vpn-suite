import type { ReactNode } from "react";
import { Button } from "../../../components/Button";
import { Stack } from "../../../primitives";
import { CompactSummaryCard, type CompactSummaryCardStat } from "../shared/CompactSummaryCard";

export interface SupportDiagnosticsCardProps {
  eyebrow: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  stats: readonly CompactSummaryCardStat[];
  copyLabel: string;
  contactLabel: string;
  onCopy: () => void;
  onContactSupport: () => void;
}

/**
 * Support diagnostics handoff card.
 * Used to summarize the user state and push the user into the support chat with context.
 */
export function SupportDiagnosticsCard({
  eyebrow,
  title,
  subtitle,
  stats,
  copyLabel,
  contactLabel,
  onCopy,
  onContactSupport,
}: SupportDiagnosticsCardProps) {
  return (
    <CompactSummaryCard
      className="support-diagnostics-card"
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      stats={stats}
      actions={(
        <Stack gap="2">
          <Button variant="primary" fullWidth onClick={onContactSupport}>
            {contactLabel}
          </Button>
          <Button variant="secondary" fullWidth onClick={onCopy}>
            {copyLabel}
          </Button>
        </Stack>
      )}
    />
  );
}
