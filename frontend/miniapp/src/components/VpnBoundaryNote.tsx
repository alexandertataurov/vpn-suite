import { HelperNote, type HelperNoteProps } from "@/design-system";
import { useI18n } from "@/hooks";

export interface VpnBoundaryNoteProps extends Omit<HelperNoteProps, "children" | "title"> {
  messageKey?: string;
  titleKey?: string;
}

export function VpnBoundaryNote({
  messageKey = "common.vpn_boundary_note",
  titleKey,
  tone = "default",
  ...props
}: VpnBoundaryNoteProps) {
  const { t } = useI18n();

  return (
    <HelperNote
      tone={tone}
      title={titleKey ? t(titleKey) : undefined}
      {...props}
    >
      {t(messageKey)}
    </HelperNote>
  );
}
