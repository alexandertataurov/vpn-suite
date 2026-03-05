import type { ReactNode } from "react";
import { ActionRow, InlineAlert, PageScaffold, Panel } from "../ui";
import type { InlineAlertProps } from "../ui";

export interface PageStateScreenProps {
  panelClassName?: string;
  label: string;
  chipClassName: string;
  chipText: string;
  alertVariant: InlineAlertProps["variant"];
  alertTitle: string;
  alertMessage: string;
  actions?: ReactNode;
}

/**
 * Reusable page-state shell for blocking authentication/error screens.
 */
export function PageStateScreen({
  panelClassName = "card edge et kpi",
  label,
  chipClassName,
  chipText,
  alertVariant,
  alertTitle,
  alertMessage,
  actions,
}: PageStateScreenProps) {
  return (
    <PageScaffold>
      <Panel variant="surface" className={panelClassName}>
        <div className="kpi-top">
          <span className="kpi-label">{label}</span>
          <span className={chipClassName}>{chipText}</span>
        </div>
        <InlineAlert variant={alertVariant} title={alertTitle} message={alertMessage} />
      </Panel>
      {actions ? <ActionRow fullWidth>{actions}</ActionRow> : null}
    </PageScaffold>
  );
}
