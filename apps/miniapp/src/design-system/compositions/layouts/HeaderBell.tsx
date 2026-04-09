import { useState } from "react";
import { Popover } from "../../components/feedback/Popover";
import { IconBell } from "../../icons";
import { useLayoutContext } from "@/context/LayoutContext";
import { useTelegramHaptics, useUnifiedAlerts } from "@/hooks";
import { HeaderAlertsContent } from "./HeaderAlertsContent";

/** Bell + notifications popover for inline use next to main content heading. */
export function HeaderBell() {
  const { stackFlow } = useLayoutContext();
  const { impact } = useTelegramHaptics();
  const { items: unifiedItems, count: unifiedCount } = useUnifiedAlerts(stackFlow);
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <Popover
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
      panelAriaLabel="Notifications"
      renderTrigger={(triggerProps) => (
        <button
          type="button"
          className="miniapp-content-bell"
          onClick={() => {
            impact("light");
            setPopoverOpen((o) => !o);
          }}
          aria-label="Notifications"
          {...triggerProps}
        >
          <IconBell size={20} strokeWidth={1.9} />
          {unifiedCount > 0 ? (
            <span className="miniapp-content-bell-indicator" aria-hidden />
          ) : null}
        </button>
      )}
    >
      <HeaderAlertsContent alerts={unifiedItems} title="Notifications" onAction={() => setPopoverOpen(false)} />
    </Popover>
  );
}
