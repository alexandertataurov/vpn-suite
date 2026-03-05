import type { ReactNode } from "react";
import { ActionZone } from "./ActionZone";
import { HeaderZone, type HeaderZoneProps } from "./HeaderZone";
import { ScrollZone } from "./ScrollZone";

export interface ViewportLayoutProps extends HeaderZoneProps {
  children: ReactNode;
  action?: ReactNode;
}

/**
 * Design-system layout primitive.
 * Canonical composition: HeaderZone + ScrollZone + ActionZone.
 */
export function ViewportLayout({
  routeLabel,
  isOnline,
  stackFlow,
  children,
  action,
}: ViewportLayoutProps) {
  return (
    <div className="tg-viewport-layout" data-ds-layout="ViewportLayout">
      <HeaderZone routeLabel={routeLabel} isOnline={isOnline} stackFlow={stackFlow} />
      <ScrollZone className="miniapp-main ds-scroll-zone">{children}</ScrollZone>
      {action ? <ActionZone>{action}</ActionZone> : null}
    </div>
  );
}
