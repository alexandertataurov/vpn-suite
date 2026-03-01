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
} from "@vpn-suite/shared/ui";

export type {
  ButtonVariant,
  ButtonSize,
  ButtonLinkProps,
  InlineAlertProps,
} from "@vpn-suite/shared/ui";

export { PageContent } from "./PageContent";
export type { PageContentProps } from "./PageContent";
export { PageHeader } from "./PageHeader";
export type { PageHeaderProps } from "./PageHeader";
export { Section } from "./Section";
export type { SectionProps } from "./Section";
export { PageScaffold } from "./PageScaffold";
export type { PageScaffoldProps } from "./PageScaffold";
export { PageSection, SectionHeaderRow } from "./PageSection";
export type { PageSectionProps, SectionHeaderRowProps } from "./PageSection";
export { ActionRow } from "./ActionRow";
export type { ActionRowProps } from "./ActionRow";
export { Display, H1, H2, H3, Body, Caption } from "./Typography";
