import type { ReactNode } from "react";
import type { MissionChipTone, PageHeaderBadgeTone } from "@/design-system";

export type StandardPageStatus = "loading" | "error" | "empty" | "ready";

export interface StandardPageState {
  status: StandardPageStatus;
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export interface StandardPageBadge {
  label: ReactNode;
  tone: PageHeaderBadgeTone;
  pulse?: boolean;
}

export interface StandardSectionBadge {
  label: ReactNode;
  tone: MissionChipTone;
  emphasizeNumeric?: boolean;
}

export interface StandardPageHeader {
  title: string;
  subtitle?: string;
  badge?: StandardPageBadge | null;
}
