import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { webappApi } from "@/api/client";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { useSession } from "@/hooks/useSession";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";

export function useRestoreAccessPageModel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession(true);
  const activeSubId = session?.subscriptions?.[0]?.plan_id ?? null;
  useTrackScreen("restore-access", activeSubId ?? null);

  const restoreMutation = useMutation({
    mutationFn: async () => {
      const sub = session?.subscriptions?.[0];
      const planId = sub?.plan_id ?? null;
      return webappApi.post<{ status: string; plan_id?: string; redirect_to?: string }>(
        "/webapp/subscription/restore",
        planId ? { plan_id: planId } : {},
      );
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      const path = data.redirect_to ?? (data.plan_id ? `/plan/checkout/${data.plan_id}` : "/plan");
      navigate(path, { replace: true });
    },
  });

  const restoreAccess = useCallback(() => {
    restoreMutation.mutate();
  }, [restoreMutation]);

  const hasGraceOrExpired =
    session?.subscriptions?.some(
      (s) =>
        s.access_status === "grace" ||
        (s.subscription_status ?? s.status) === "expired",
    ) ?? false;

  const pageState =
    !session?.user || !hasGraceOrExpired
      ? { status: "empty" as const }
      : { status: "ready" as const };

  return {
    header: {
      title: "Restore access",
      subtitle: "Your subscription has expired",
    },
    description:
      "Restore your connection in one tap and keep your previous setup. You'll complete payment on the plan page. Any pending referral days will apply when you restore.",
    pageState,
    isRestoring: restoreMutation.isPending,
    restoreAccess,
  };
}
