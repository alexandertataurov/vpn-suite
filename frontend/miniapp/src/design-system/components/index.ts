/**
 * Design system components — reusable UI with variant/size/tone APIs.
 * Order: Typography → Buttons → Forms → Feedback → Display → Utility.
 * Use MissionCard from patterns for cards; no Card in components to avoid cycles.
 */

// —— Typography (semantic layer over primitives) ——
export { Display, H1, H2, H3, Body, Caption } from "./typography";

// —— Buttons ——
export { Button, ButtonPrimitive, getButtonClassName } from "./Button";
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

// —— Feedback ——
export { Skeleton, SkeletonLine, SkeletonCard, SkeletonList } from "./feedback/Skeleton";
export type { SkeletonVariant } from "./feedback/Skeleton";
export { InlineAlert, type InlineAlertProps } from "./feedback/InlineAlert";
export { Modal, ConfirmModal, ConfirmDanger } from "./feedback/Modal";
export type { ConfirmDangerPayload, ConfirmDangerProps } from "./feedback/Modal";
export { Popover, type PopoverProps, type PopoverTriggerProps } from "./feedback/Popover";
export { Toast, ToastContainer, ToastViewport, useToast } from "./feedback/Toast";

// —— Display ——
export { ProgressBar, type ProgressBarProps } from "./display/ProgressBar";

// —— Utility ——
export { TelegramThemeBridge } from "./TelegramThemeBridge";
