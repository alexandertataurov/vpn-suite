// Explicit re-exports only.
// Why: avoids creating a “hidden public API” via `export *`, which makes pruning/renames unsafe.

// Local top-level hooks (commonly imported by pages/features)
export { useApiHealth } from "./useApiHealth";
export { useGlobalHapticFeedback } from "./useGlobalHapticFeedback";
export { useHideKeyboard } from "./useHideKeyboard";
export { useLayoutDebugMode } from "./useLayoutDebugMode";
export { useOnlineStatus } from "./useOnlineStatus";
export { useScrollInputIntoView } from "./useScrollInputIntoView";
export { useSession } from "./useSession";
export { useTelegramBackButtonController } from "./useTelegramBackButtonController";
export { useTelegramHaptics } from "./useTelegramHaptics";
export { useTelegramMainButton } from "./useTelegramMainButton";
export { useTelegramWebApp, initTelegramRuntime } from "./useTelegramWebApp";
export { useTelemetry } from "./useTelemetry";
export { useTrackScreen } from "./useTrackScreen";
export { useViewportDimensions, type SafeAreaInsets } from "./useViewportDimensions";

// Subpackages: telegram / controls / system / features
export {
  useSafeAreaInsets,
  useTelegramApp,
  useTelegramEvent,
  useTelegramInitData,
  useTelegramTheme,
  useViewport,
} from "./telegram";

export { useBackButton, useFullscreen, useMainButton } from "./controls";

export {
  useBiometrics,
  useCloudStorage,
  useClosingConfirmation,
  useHaptics,
  usePermissions,
  usePopup,
} from "./system";

export {
  useClipboard,
  useConnectionStatus,
  useMiniAppNavigation,
  useModalManager,
  useOpenLink,
  usePayments,
  useQrScanner,
  useShare,
  useToastManager,
  type ToastMessage,
} from "./features";

// Legacy aliases (keep for now; used by callers importing `{ useInitData, useTheme }`)
export { useTelegramInitData as useInitData, useTelegramTheme as useTheme } from "./telegram";
