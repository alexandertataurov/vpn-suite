/**
 * Suppression and cooldown rules (UPSELL-ENGINE-SPEC §13).
 */

import type { UpgradeIntent, UpsellHistoryEntry } from "./upsell.types";
import { SUPPRESSION_MS } from "./upsell.constants";

export function shouldSuppressUpsell(
  trigger: UpgradeIntent,
  history: UpsellHistoryEntry[] | undefined,
  sessionShownTriggers: UpgradeIntent[] | undefined,
  now: Date,
): { suppressed: boolean; reason?: string } {
  if (!history?.length && !sessionShownTriggers?.length) {
    return { suppressed: false };
  }

  const lastDismissed = history
    ?.filter((h) => h.trigger === trigger && h.dismissedAt)
    .sort((a, b) => new Date(b.dismissedAt ?? 0).getTime() - new Date(a.dismissedAt ?? 0).getTime())[0];
  if (lastDismissed?.dismissedAt) {
    const cooldown = SUPPRESSION_MS[trigger];
    if (cooldown != null) {
      const dismissedAt = new Date(lastDismissed.dismissedAt).getTime();
      if (now.getTime() - dismissedAt < cooldown) {
        return { suppressed: true, reason: "offer_dismissed_recently" };
      }
    }
  }

  if (sessionShownTriggers?.includes(trigger)) {
    return { suppressed: true, reason: "session_deduplication" };
  }

  return { suppressed: false };
}
