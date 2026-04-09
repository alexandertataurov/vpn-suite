import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@vpn-suite/shared";
import { webappApi } from "@/api/client";
import { useTrackScreen, useTelemetry, useSession } from "@/hooks";
import { webappQueryKeys } from "@/lib";
import { useI18n } from "@/hooks";
import { getPrimarySubscription } from "./helpers";

function getRestoreErrorMessage(err: unknown, t: (k: string) => string): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case "NOT_RESTORABLE":
        return t("restore.error_not_restorable");
      case "NO_SUBSCRIPTION":
        return t("restore.error_no_subscription");
      case "NO_PLAN":
        return t("restore.error_no_plan");
      default:
        return err.message || t("common.could_not_load_generic");
    }
  }
  return t("common.could_not_load_generic");
}

export function useRestoreAccessPageModel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session, isLoading: isSessionLoading } = useSession(true);
  const primarySub = getPrimarySubscription(session);
  const activeSubId = primarySub?.plan_id ?? null;
  useTrackScreen("restore-access", activeSubId ?? null);
  const { track } = useTelemetry(activeSubId ?? null);

  const hasGraceOrExpired =
    session?.subscriptions?.some(
      (s) =>
        s.access_status === "grace" ||
        (s.subscription_status ?? s.status) === "expired",
    ) ?? false;

  const restoreMutation = useMutation({
    mutationFn: async () => {
      const sub =
        session?.subscriptions?.find(
          (candidate) =>
            candidate.access_status === "grace" ||
            (candidate.subscription_status ?? candidate.status) === "expired",
        ) ?? primarySub;
      const planId = sub?.plan_id ?? null;
      return webappApi.post<{ status: string; plan_id?: string; redirect_to?: string }>(
        "/webapp/subscription/restore",
        sub
          ? {
              subscription_id: sub.id,
              ...(planId ? { plan_id: planId } : {}),
            }
          : {},
      );
    },
    onSuccess: (data) => {
      track("restore_access_succeeded", {
        screen_name: "restore-access",
        plan_id: data.plan_id ?? activeSubId ?? undefined,
        redirect_to: data.redirect_to,
      });
      void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      const path = data.redirect_to ?? (data.plan_id ? `/plan/checkout/${data.plan_id}` : "/plan");
      navigate(path, { replace: true });
    },
    onError: (error) => {
      const err = error instanceof ApiError ? error : (error as { code?: string; message?: string });
      track("restore_access_failed", {
        screen_name: "restore-access",
        plan_id: activeSubId ?? undefined,
        error_code: err.code,
        reason: err.message,
      });
    },
  });

  const restoreAccess = useCallback(() => {
    track("restore_access_started", {
      screen_name: "restore-access",
      plan_id: activeSubId ?? undefined,
      has_grace: hasGraceOrExpired,
    });
    restoreMutation.mutate();
  }, [activeSubId, hasGraceOrExpired, restoreMutation, track]);

  const { t } = useI18n();

  const pageState =
    !session?.user
      ? { status: "empty" as const }
      : !hasGraceOrExpired
        ? {
            status: "empty" as const,
            title: t("restore.inline_no_expired_title"),
            message: t("restore.inline_no_expired_message"),
          }
        : restoreMutation.isPending
          ? { status: "loading" as const }
          : restoreMutation.isError
            ? {
                status: "error" as const,
                title: t("common.could_not_load_title"),
                message: getRestoreErrorMessage(restoreMutation.error, t),
              }
            : { status: "ready" as const };

  return {
    header: {
      title: t("restore.header_title"),
      subtitle: t("restore.header_subtitle"),
    },
    description: t("restore.info_message"),
    pageState,
    hasGraceOrExpired,
    hasSession: !!session?.user,
    isSessionLoading,
    isRestoring: restoreMutation.isPending,
    restoreAccess,
  };
}
