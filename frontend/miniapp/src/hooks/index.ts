// Explicit re-exports only.
// Why: avoids creating a “hidden public API” via `export *`, which makes pruning/renames unsafe.

// Local top-level hooks (commonly imported by pages/features)
export { useApiHealth } from "./useApiHealth";
export { useGlobalHapticFeedback } from "./useGlobalHapticFeedback";
export { useUnifiedAlerts, type UseUnifiedAlertsResult } from "./useUnifiedAlerts";
export { useHideKeyboard } from "./useHideKeyboard";
export { useLayoutDebugMode } from "./useLayoutDebugMode";
export { useOnlineStatus } from "./useOnlineStatus";
export { usePullToRefresh } from "./usePullToRefresh";
export { useScrollInputIntoView } from "./useScrollInputIntoView";
export { useSession } from "./useSession";
export { useUpdateSubscription, type UseUpdateSubscriptionOptions } from "./useUpdateSubscription";
export { useTelegramBackButtonController } from "./useTelegramBackButtonController";
export { useTelegramHaptics } from "./useTelegramHaptics";
export { useTelegramMainButton } from "./useTelegramMainButton";
export { useTelegramWebApp, initTelegramRuntime } from "./useTelegramWebApp";
export { useTelemetry } from "./useTelemetry";
export { useTrackScreen } from "./useTrackScreen";
export { useViewportDimensions, type SafeAreaInsets } from "./useViewportDimensions";

// Targeted cross-feature exports from subpackages.
export { useOpenLink, usePayments } from "./features";
export { useTelegramTheme } from "./telegram";
