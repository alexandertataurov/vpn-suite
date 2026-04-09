/**
 * Design system components — reusable UI with variant/size/tone APIs.
 * Order: Typography → Buttons → Forms → Feedback → Display → Utility.
 * Use MissionCard from patterns for cards; no Card in components to avoid cycles.
 */

// —— Typography (semantic layer over primitives) ——
export { Display, H1, H2, H3, Body, Caption } from "./typography";

// —— Buttons ——
export { Button, ButtonGroup, ButtonPrimitive, getButtonClassName } from "./Button";
export type {
  ButtonVariant,
  ButtonSize,
  ButtonTone,
  ButtonStatus,
  ButtonProps,
  ButtonPrimitiveProps,
} from "./Button";

// —— Forms ——
export { Field } from "./forms/Field";
export type { FieldProps } from "./forms/Field";
export { Input } from "./forms/Input";
export { Label, type LabelProps } from "./forms/Label";
export { HelperText, type HelperTextProps, type HelperTextVariant } from "./forms/HelperText";
export { Select, type SelectOption, type SelectProps } from "./forms/Select";
export { Textarea, type TextareaProps } from "./forms/Textarea";
export { Checkbox, type CheckboxProps } from "./forms/Checkbox";
export { Switch, type SwitchProps } from "./forms/Switch";
export {
  BillingPeriodToggle,
  type BillingPeriodToggleProps,
  type BillingPeriodValue,
} from "./forms/BillingPeriodToggle";

// —— Feedback ——
export { Skeleton, SkeletonLine, SkeletonCard, SkeletonList } from "./feedback/Skeleton";
export type { SkeletonVariant } from "./feedback/Skeleton";
export { BootScreen, type BootScreenProps, type BootIconState } from "./feedback/BootScreen";
export { InlineAlert, type InlineAlertProps } from "./feedback/InlineAlert";
export { Modal, ConfirmModal, ConfirmDanger } from "./feedback/Modal";
export type { ConfirmDangerPayload, ConfirmDangerProps } from "./feedback/Modal";
export { Popover, type PopoverProps, type PopoverTriggerProps } from "./feedback/Popover";
export { Toast, ToastContainer, ToastViewport } from "./feedback/Toast";
export { useToast } from "./feedback/useToast";

// —— Display ——
export {
  ProgressBar,
  type ProgressBarProps,
  type ProgressBarThreshold,
  type ProgressBarAnnotationVariant,
  type ProgressBarSize,
  type ProgressBarLayout,
} from "./display/ProgressBar";

// —— Utility ——
export { TelegramThemeBridge } from "./TelegramThemeBridge";
