import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconChevronLeft, IconX } from "../icons";
import { telegramClient } from "@/telegram/telegramCoreClient";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";

export interface ShellContextBlockProps {
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

export function ShellContextBlock({ stackFlow = false }: ShellContextBlockProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { impact } = useTelegramHaptics();
  const action = resolveHeaderAction(location.pathname, stackFlow);
  const backState = (location.state as { from?: string } | null) ?? null;

  const handleAction = useCallback(() => {
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
  }, [action, backState?.from, impact, location.pathname, navigate]);

  const actionLabel = action === "close" ? "Close" : "Back";

  return (
    <section className="miniapp-shell-context" aria-label="Navigation and status">
      <div className="miniapp-shell-context-row">
        {action ? (
          <button
            type="button"
            className="miniapp-shell-context-action"
            onClick={handleAction}
            aria-label={action === "close" ? "Close screen" : "Go back"}
          >
            {action === "close"
              ? <IconX size={18} strokeWidth={1.9} />
              : <IconChevronLeft size={18} strokeWidth={1.9} />}
            <span>{actionLabel}</span>
          </button>
        ) : (
          <span className="miniapp-shell-context-spacer" aria-hidden />
        )}
      </div>
    </section>
  );
}
