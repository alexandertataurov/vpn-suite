import { IconGlobe, IconChevronRight } from "@/design-system/icons";
import { Button, ListRow, Popover } from "@/design-system";

export interface SettingsLanguageOption {
  id: "auto" | "en" | "ru";
  label: string;
}

export interface SettingsLanguageMenuRowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuId: string;
  menuAriaLabel: string;
  title: string;
  description: string;
  value?: string;
  activeId: SettingsLanguageOption["id"];
  options: SettingsLanguageOption[];
  onTriggerClick: () => void;
  onSelect: (id: SettingsLanguageOption["id"]) => void;
}

export function SettingsLanguageMenuRow({
  open,
  onOpenChange,
  menuId,
  menuAriaLabel,
  title,
  description,
  value,
  activeId,
  options,
  onTriggerClick,
  onSelect,
}: SettingsLanguageMenuRowProps) {
  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      id={menuId}
      panelClassName="miniapp-popover-panel--menu"
      panelAriaLabel={menuAriaLabel}
      panelRole="menu"
      triggerHasPopup="menu"
      trapFocus
      renderTrigger={(triggerProps) => (
        <ListRow
          icon={<IconGlobe size={15} strokeWidth={2} />}
          iconTone="neutral"
          title={title}
          subtitle={description}
          right={
            <div className="home-row-right-group">
              {value ? <span className="settings-action-value">{value}</span> : null}
              <IconChevronRight size={13} strokeWidth={2.5} />
            </div>
          }
          className="settings-list-row--single-line-description"
          onClick={onTriggerClick}
          {...triggerProps}
        />
      )}
    >
      <ul className="miniapp-menu-list settings-context-list" role="menu" aria-label={menuAriaLabel}>
        {options.map((option) => (
          <li key={option.id} role="none">
            <Button
              type="button"
              role="menuitemradio"
              aria-checked={activeId === option.id}
              variant="ghost"
              size="sm"
              className={`miniapp-menu-item settings-context-item ${
                activeId === option.id ? "settings-context-item--active" : ""
              }`}
              data-pressable="true"
              onClick={() => onSelect(option.id)}
            >
              <span className="miniapp-menu-item-text">
                <span className="miniapp-menu-item-title">{option.label}</span>
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </Popover>
  );
}
