import { Button, Popover } from "@/design-system";
import { IconChevronRight, IconGlobe } from "@/design-system/icons";
import { ListRow } from "../../patterns/cards/ListCard";

export interface LanguageOption {
  id: "auto" | "en" | "ru";
  label: string;
}

export interface LanguageMenuRowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuId: string;
  menuAriaLabel: string;
  title: string;
  description: string;
  value?: string;
  activeId: LanguageOption["id"];
  options: LanguageOption[];
  onTriggerClick: () => void;
  onSelect: (id: LanguageOption["id"]) => void;
}

export function LanguageMenuRow({
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
}: LanguageMenuRowProps) {
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
