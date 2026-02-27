import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageView } from "../telemetry";

export function TelemetryPageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    pageView(location.pathname);
  }, [location.pathname]);
  return null;
}
