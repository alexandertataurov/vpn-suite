/**
 * Miniapp UI — single source of truth.
 * Re-exports shared components. Adds miniapp patterns.
 * All visual values from tokens. No inline styles except whitelisted.
 */

export {
  Button,
  ButtonLink,
  getButtonClassName,
  Panel,
  Input,
  InlineAlert,
  Skeleton,
  SkeletonList,
  EmptyState,
  ConfirmModal,
  ProgressBar,
  Stat,
  DeviceCard,
  ToastContainer,
  useToast,
  PrimitiveBadge,
} from "@/lib/ui";

export type {
  ButtonVariant,
  ButtonSize,
  ButtonLinkProps,
  InlineAlertProps,
} from "@/lib/ui";

export { PageHeader } from "./PageHeader";
export type { PageHeaderProps } from "./PageHeader";
export { PageScaffold } from "./PageScaffold";
export type { PageScaffoldProps } from "./PageScaffold";
export { PageFrame } from "./PageFrame";
export type { PageFrameProps } from "./PageFrame";
export { PageSection, SectionHeaderRow } from "./PageSection";
export type { PageSectionProps, SectionHeaderRowProps } from "./PageSection";
export { ActionRow } from "./ActionRow";
export type { ActionRowProps } from "./ActionRow";
export { Display, H1, H2, H3, Body, Caption } from "./Typography";
