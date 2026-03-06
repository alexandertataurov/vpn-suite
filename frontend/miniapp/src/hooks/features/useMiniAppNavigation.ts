import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function useMiniAppNavigation() {
  const routerNavigate = useNavigate();

  const navigate = useCallback(
    (to: string) => {
      routerNavigate(to);
    },
    [routerNavigate],
  );

  const replace = useCallback(
    (to: string) => {
      routerNavigate(to, { replace: true });
    },
    [routerNavigate],
  );

  const goBack = useCallback(() => {
    routerNavigate(-1);
  }, [routerNavigate]);

  return { navigate, goBack, replace };
}

