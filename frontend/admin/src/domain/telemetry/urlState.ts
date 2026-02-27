import { type TelemetryMode, type TelemetryRefresh, type TelemetryRangePreset, type TelemetrySelectedResource, type TelemetryUrlState } from "./telemetryTypes";

const DEFAULT_MODE: TelemetryMode = "operator";
const DEFAULT_REGION = "all";
const DEFAULT_RANGE: TelemetryRangePreset = "1h";
const DEFAULT_REFRESH: TelemetryRefresh = "30s";

export function parseTelemetryUrlState(params: URLSearchParams): TelemetryUrlState {
  const modeParam = params.get("mode");
  const mode: TelemetryMode = modeParam === "engineer" ? "engineer" : DEFAULT_MODE;

  const region = params.get("region") ?? DEFAULT_REGION;

  const rangeParam = params.get("range") ?? DEFAULT_RANGE;
  const isPreset = rangeParam === "5m" || rangeParam === "15m" || rangeParam === "1h" || rangeParam === "6h" || rangeParam === "24h";
  const range: TelemetryRangePreset | "custom" = isPreset ? (rangeParam as TelemetryRangePreset) : "custom";

  const refreshParam = params.get("refresh") as TelemetryRefresh | null;
  const refresh: TelemetryRefresh =
    refreshParam === "off" || refreshParam === "15s" || refreshParam === "30s" || refreshParam === "60s"
      ? refreshParam
      : DEFAULT_REFRESH;

  const selectedRaw = params.get("selected");
  let selected: TelemetrySelectedResource | undefined;
  if (selectedRaw) {
    try {
      const parsed = JSON.parse(selectedRaw) as TelemetrySelectedResource;
      if (parsed && typeof parsed === "object" && typeof parsed.type === "string" && typeof parsed.id === "string") {
        selected = parsed;
      }
    } catch {
      // ignore malformed selected param
    }
  }

  return {
    mode,
    region,
    range,
    refresh,
    selected,
  };
}

export function updateTelemetryUrlState(
  params: URLSearchParams,
  patch: Partial<TelemetryUrlState>
): URLSearchParams {
  const next = new URLSearchParams(params);
  if (patch.mode) next.set("mode", patch.mode);
  if (patch.region) next.set("region", patch.region);
  if (patch.range) next.set("range", patch.range);
  if (patch.refresh) next.set("refresh", patch.refresh);
  if (patch.selected === undefined) {
    // do nothing
  } else if (patch.selected === null) {
    next.delete("selected");
  } else {
    next.set("selected", JSON.stringify(patch.selected));
  }
  return next;
}

export function refreshToMs(refresh: TelemetryRefresh): number | false {
  switch (refresh) {
    case "off":
      return false;
    case "15s":
      return 15_000;
    case "30s":
      return 30_000;
    case "60s":
      return 60_000;
    default:
      return 30_000;
  }
}

