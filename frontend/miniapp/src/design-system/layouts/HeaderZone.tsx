import { lazy, Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconBell, IconChevronLeft, IconX } from "../icons";
import { telegramClient } from "@/telegram/telegramCoreClient";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";
import type { HeaderAlertItem } from "./HeaderAlertsContent";

const HeaderAlertsContent = lazy(() =>
  import("./HeaderAlertsContent").then((module) => ({ default: module.HeaderAlertsContent })),
);

/**
 * Production layer: fixed header (title, nav). Height 56–64px. Never scrolls.
 */
export interface HeaderZoneProps {
  routeLabel: string;
  isOnline: boolean;
  stackFlow?: boolean;
}

type HeaderAction = "back" | "close" | null;
function resolveHeaderAction(pathname: string, stackFlow: boolean): HeaderAction {
  if (!stackFlow) return null;
  if (pathname === "/onboarding" || pathname.startsWith("/plan/checkout/")) {
    return "close";
  }
  return "back";
}

export function HeaderZone({ routeLabel, isOnline, stackFlow = false }: HeaderZoneProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { impact } = useTelegramHaptics();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const bellButtonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const alertsId = useId();
  const action = resolveHeaderAction(location.pathname, stackFlow);
  const backState = (location.state as { from?: string } | null) ?? null;
  const alerts = useMemo<HeaderAlertItem[]>(() => {
    const signal: HeaderAlertItem = isOnline
      ? {
          id: "signal",
          tone: "success",
          title: "Signal stable",
          message: "Connection telemetry is live.",
        }
      : {
          id: "signal",
          tone: "warning",
          title: "Signal lost",
          message: "Reconnect to resume secure updates.",
        };

    const summary: HeaderAlertItem = stackFlow
      ? {
          id: "context",
          tone: "info",
          title: "Flow mode",
          message: "Use back to return to previous step.",
        }
      : {
          id: "context",
          tone: "info",
          title: "Status",
          message: "No critical alerts right now.",
        };

    return [signal, summary];
  }, [isOnline, stackFlow]);
  const activeAlertCount = alerts.filter((alert) => alert.tone === "warning").length;
  const bellAriaLabel = activeAlertCount > 0
    ? `${activeAlertCount} active alert${activeAlertCount === 1 ? "" : "s"}`
    : "No active alerts";

  const handleLeftAction = useCallback(() => {
    if (!action) return;
    impact("light");

    if (action === "close") {
      if (telegramClient.isAvailable()) {
        telegramClient.close();
        return;
      }
      if (location.pathname.startsWith("/plan/checkout/")) {
        navigate("/plan", { replace: true });
        return;
      }
      navigate("/", { replace: true });
      return;
    }

    if (typeof backState?.from === "string" && backState.from && backState.from !== location.pathname) {
      navigate(backState.from);
      return;
    }
    navigate(-1);
  }, [action, impact, backState?.from, location.pathname, navigate]);

  const handleBellToggle = useCallback(() => {
    impact("light");
    setIsAlertsOpen((open) => !open);
  }, [impact]);

  useEffect(() => {
    setIsAlertsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isAlertsOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (bellButtonRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setIsAlertsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAlertsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAlertsOpen]);

  return (
    <header
      className={`miniapp-header ${stackFlow ? "miniapp-header--stack" : ""}`.trim()}
      data-layer="HeaderZone"
    >
      <div className="miniapp-header-inner">
        <div className="miniapp-header-slot miniapp-header-slot--left">
          {action ? (
            <button
              type="button"
              className="miniapp-header-nav-button"
              onClick={handleLeftAction}
              aria-label={action === "close" ? "Close screen" : "Go back"}
            >
              {action === "close"
                ? <IconX size={24} strokeWidth={1.8} />
                : <IconChevronLeft size={24} strokeWidth={1.8} />}
            </button>
          ) : (
            <span className="miniapp-header-slot-placeholder" aria-hidden />
          )}
        </div>

        <h1
          className="miniapp-header-title miniapp-header-title--alpha"
          title={routeLabel}
          aria-label={routeLabel}
        >
          <span className="miniapp-header-alpha" aria-hidden>
            α
          </span>
        </h1>

        <div className="miniapp-header-slot miniapp-header-slot--right">
          <div className="miniapp-header-alerts">
            <button
              ref={bellButtonRef}
              type="button"
              className={`miniapp-header-bell ${isAlertsOpen ? "is-open" : ""}`.trim()}
              onClick={handleBellToggle}
              aria-label={bellAriaLabel}
              aria-expanded={isAlertsOpen}
              aria-controls={alertsId}
              aria-haspopup="dialog"
            >
              <IconBell size={20} strokeWidth={1.8} />
              <span
                className={`miniapp-header-bell-signal ${isOnline ? "is-online" : "is-offline"}`}
                aria-hidden
              />
              {activeAlertCount > 0 ? (
                <span className="miniapp-header-bell-badge" aria-hidden>
                  {activeAlertCount}
                </span>
              ) : null}
            </button>

            {isAlertsOpen ? (
              <div
                id={alertsId}
                ref={popoverRef}
                className="miniapp-header-alert-popover"
                role="dialog"
                aria-label="Signals and alerts"
              >
                <Suspense fallback={null}>
                  <HeaderAlertsContent alerts={alerts} />
                </Suspense>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
