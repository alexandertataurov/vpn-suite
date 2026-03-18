/**
 * Design system patterns — composed components (MissionCard, MissionChip, etc.).
 * Grouped by domain: mission, content, blocks, cards, home, ui.
 * Use primitives + components; no business logic in patterns.
 */
export {
  MissionCard,
  MissionChip,
  MissionAlert,
  MissionModuleHead,
  MissionOperationArticle,
  MissionOperationButton,
  MissionOperationLink,
  MissionPrimaryAnchor,
  MissionPrimaryLink,
  MissionPrimaryButton,
  MissionSecondaryButton,
  MissionProgressBar,
  MissionSecondaryAnchor,
  MissionSecondaryLink,
  MissionStatusDot,
  type MissionAlertTone,
  type MissionChipTone,
  type MissionHealthTone,
  type MissionPrimaryButtonTone,
  type MissionStatusTone,
  type MissionTone,
  type MissionCardProps,
  type MissionChipProps,
  type MissionAlertProps,
  type MissionModuleHeadProps,
  type MissionOperationArticleProps,
  type MissionOperationButtonProps,
  type MissionOperationLinkProps,
  type MissionProgressBarProps,
  type MissionStatusDotProps,
} from "./mission/Mission";

export { FallbackScreen } from "./blocks/FallbackScreen";
export type { FallbackScreenProps, FallbackScenario } from "./blocks/FallbackScreen";
export { OverflowActionMenu } from "./ui/OverflowActionMenu";
export type { OverflowActionMenuProps, OverflowActionMenuItem } from "./ui/OverflowActionMenu";
export { OfflineBanner } from "./blocks/OfflineBanner";
export type { OfflineBannerProps } from "./blocks/OfflineBanner";
export { PageStateScreen } from "./blocks/PageStateScreen";
export type { PageStateScreenProps, PageStateMode, PageStateVariant } from "./blocks/PageStateScreen";
export { DataGrid, DataCell } from "./ui/DataGrid";
export type { DataGridProps, DataCellProps, DataCellValueTone, DataCellType, DataGridLayout } from "./ui/DataGrid";

export { ListCard, ListRow } from "./cards/ListCard";
export type { ListCardProps, ListRowProps, ListRowIconTone, ListRowDeviceType, DeviceStatus } from "./cards/ListCard";
export { RowItem, CardRow, RowItemSkeleton } from "./RowItem";
export type { RowItemProps, RowItemIconVariant, CardRowProps, RowItemSkeletonProps } from "./RowItem";

export {
  FormField,
  SettingsCard,
  SettingsDivider,
  ToggleRow,
  SegmentedControl,
} from "./content/ContentForms";
export type {
  FormFieldProps,
  FormFieldState,
  SettingsCardProps,
  ToggleRowProps,
  SegmentedControlProps,
  SegmentedControlOption,
  SegmentedControlBadgeVariant,
} from "./content/ContentForms";

export { ButtonRow, ButtonRowAuto, CardFooterLink } from "./content/ContentButtons";
export type { ButtonRowProps, ButtonRowAutoProps, CardFooterLinkProps } from "./content/ContentButtons";

export { StatusChip } from "./ui/StatusChip";
export type { StatusChipProps, StatusChipVariant } from "./ui/StatusChip";
export { PillChip } from "./ui/PillChip";
export type { PillChipProps, PillChipStatus, PillChipVariant } from "./ui/PillChip";
export { Avatar } from "./ui/Avatar";
export type { AvatarProps } from "./ui/Avatar";
export { Badge } from "./ui/Badge";
export type { BadgeProps, BadgeVariant } from "./ui/Badge";
export { SectionLabel } from "./ui/SectionLabel";
export type { SectionLabelProps } from "./ui/SectionLabel";
export { SettingsButton } from "./ui/SettingsButton";
export type { SettingsButtonProps } from "./ui/SettingsButton";
export { StarsAmount } from "./ui/StarsAmount";
export type { StarsAmountProps } from "./ui/StarsAmount";

export { ActionCard } from "./cards/ActionCard";
export type { ActionCardProps } from "./cards/ActionCard";
export { ServerCard } from "./cards/ServerCard";
export type { ServerCardProps } from "./cards/ServerCard";
export { SelectionCard } from "./cards/SelectionCard";
export type { SelectionCardProps } from "./cards/SelectionCard";

export { EmptyStateBlock, EMPTY_STATE_VARIANTS } from "./blocks/EmptyStateBlock";
export type { EmptyStateBlockProps, EmptyStateVariant } from "./blocks/EmptyStateBlock";

export { HeroCard } from "./blocks/HeroCard";
export type { HeroCardProps, HeroCardStatus, HeroCardVariant } from "./blocks/HeroCard";
export { CalloutBlock } from "./blocks/CalloutBlock";
export type { CalloutBlockProps } from "./blocks/CalloutBlock";
export { ActionBanner } from "./blocks/ActionBanner";
export type { ActionBannerProps, ActionBannerTone } from "./blocks/ActionBanner";
export { HelpFooter } from "./blocks/HelpFooter";
export type { HelpFooterProps } from "./blocks/HelpFooter";
export { HelperNote } from "./blocks/HelperNote";
export type { HelperNoteProps } from "./blocks/HelperNote";

export { DisclosureItem } from "./ui/DisclosureItem";
export type { DisclosureItemProps } from "./ui/DisclosureItem";
export { ToneBadge } from "./ui/ToneBadge";
export type { ToneBadgeProps, ToneBadgeTone } from "./ui/ToneBadge";

export { HeaderBar } from "./content/HeaderBar";
export type { HeaderBarProps } from "./content/HeaderBar";
export { LabeledRow } from "./content/LabeledRow";
export type { LabeledRowProps } from "./content/LabeledRow";

export { SupportActionList } from "./ui/SupportActionList";
export type { SupportActionListProps, SupportActionItem } from "./ui/SupportActionList";
