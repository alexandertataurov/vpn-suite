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
export type { FallbackScreenProps } from "./blocks/FallbackScreen";
export { HomeDynamicBlock } from "./home/HomeDynamicBlock";
export type { HomeDynamicBlockProps } from "./home/HomeDynamicBlock";
export { HomeHeroPanel } from "./home/HomeHeroPanel";
export type { HomeHeroPanelProps, ConnectionPhase } from "./home/HomeHeroPanel";
export { HomePrimaryActionZone } from "./home/HomePrimaryActionZone";
export type { HomePrimaryActionZoneProps } from "./home/HomePrimaryActionZone";
export { HomeQuickActionGrid } from "./home/HomeQuickActionGrid";
export type { HomeQuickActionGridProps } from "./home/HomeQuickActionGrid";
export { OverflowActionMenu } from "./ui/OverflowActionMenu";
export type { OverflowActionMenuProps, OverflowActionMenuItem } from "./ui/OverflowActionMenu";
export { OfflineBanner } from "./blocks/OfflineBanner";
export { PageStateScreen } from "./blocks/PageStateScreen";
export type { PageStateScreenProps } from "./blocks/PageStateScreen";
export { DataGrid, DataCell } from "./ui/DataGrid";
export type { DataGridProps, DataCellProps, DataCellValueTone } from "./ui/DataGrid";

export { ListCard, ListRow } from "./cards/ListCard";
export type { ListCardProps, ListRowProps, ListRowIconTone } from "./cards/ListCard";

export {
  FormField,
  SettingsCard,
  SettingsDivider,
  ToggleRow,
  SegmentedControl,
} from "./content/ContentForms";
export type {
  FormFieldProps,
  SettingsCardProps,
  ToggleRowProps,
  SegmentedControlProps,
  SegmentedControlOption,
} from "./content/ContentForms";

export { ButtonRow, ButtonRowAuto, CardFooterLink } from "./content/ContentButtons";
export type { ButtonRowProps, ButtonRowAutoProps, CardFooterLinkProps } from "./content/ContentButtons";

export { StatusChip } from "./ui/StatusChip";
export type { StatusChipProps, StatusChipVariant } from "./ui/StatusChip";

export { ServerCard } from "./cards/ServerCard";
export type { ServerCardProps } from "./cards/ServerCard";

export { EmptyStateBlock } from "./blocks/EmptyStateBlock";
export type { EmptyStateBlockProps } from "./blocks/EmptyStateBlock";

export { SupportActionList } from "./ui/SupportActionList";
export type { SupportActionListProps, SupportActionItem } from "./ui/SupportActionList";
