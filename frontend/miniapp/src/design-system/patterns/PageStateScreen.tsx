import type { ReactNode } from "react";
import { PageScaffold } from "../layouts";
import {
  MissionAlert,
  MissionCard,
  MissionChip,
  MissionModuleHead,
  type MissionAlertTone,
  type MissionChipTone,
  type MissionTone,
} from "./MissionPrimitives";

export interface PageStateScreenProps {
  panelTone?: MissionTone;
  label: string;
  chipTone?: MissionChipTone;
  chipText: string;
  alertTone: MissionAlertTone;
  alertTitle: string;
  alertMessage: string;
  actions?: ReactNode;
}

/**
 * Reusable page-state shell for blocking authentication/error screens.
 */
export function PageStateScreen({
  panelTone = "blue",
  label,
  chipTone = "neutral",
  chipText,
  alertTone,
  alertTitle,
  alertMessage,
  actions,
}: PageStateScreenProps) {
  return (
    <PageScaffold>
      <MissionCard tone={panelTone} className="state-card">
        <MissionModuleHead
          label={label}
          chip={<MissionChip tone={chipTone}>{chipText}</MissionChip>}
        />
        <MissionAlert tone={alertTone} title={alertTitle} message={alertMessage} />
      </MissionCard>
      {actions ? <div className="state-actions">{actions}</div> : null}
    </PageScaffold>
  );
}
