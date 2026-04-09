import React, { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Button, InlineAlert } from "@/design-system";
import type { IconType } from "@/design-system/icons";
import * as IconExports from "@/design-system/icons";
import {
  FoundationSection,
  GroupLabel,
  TokenGrid,
  FoundationColorPreview,
  TokenSlot,
  resolveToken,
  FoundationSquarePreview,
} from "./foundationShared";
import { H2 } from "@/design-system";
import "./iconsFoundation.css";

type IconEntry = {
  key: string;
  name: string;
  Icon: IconType;
};

function formatIconName(iconKey: string): string {
  const base = iconKey.startsWith("Icon") ? iconKey.slice(4) : iconKey;
  return base.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function getIconEntries(): IconEntry[] {
  return Object.entries(IconExports)
    .filter(([key, value]) => key.startsWith("Icon") && typeof value === "function")
    .map(([key, value]) => ({
      key,
      name: formatIconName(key),
      Icon: value as unknown as IconType,
    }));
}

const ICONS = getIconEntries();

const sizes = {
  sm: "--icon-size-sm",
  md: "--icon-size-md",
} as const;

const meta: Meta = {
  title: "Foundations/Icons",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Iconography foundations: use design-system icon exports and semantic sizing tokens for consistent visual weight.",
      },
    },
  },
};

export default meta;

export const Sizes: StoryObj = {
  name: "Icon sizes",
  render: () => {
    const Icon = ICONS[0]?.Icon;
    if (!Icon) return null;

    return (
      <FoundationSection>
        <GroupLabel>Size tokens</GroupLabel>
        <TokenGrid>
          {Object.entries(sizes).map(([label, token]) => (
            <TokenSlot key={token} label={token} value={resolveToken(token)}>
              <FoundationColorPreview token="--color-surface-2" />
              <FoundationSquarePreview size={72}>
                <Icon size={label === "sm" ? 16 : 20} strokeWidth={2} />
              </FoundationSquarePreview>
            </TokenSlot>
          ))}
        </TokenGrid>
      </FoundationSection>
    );
  },
};

export const Gallery: StoryObj = {
  name: "Search + selection gallery",
  parameters: {
    docs: {
      description: {
        story: "Search the icon set and click a tile to preview usage inside real UI (Button + Alert).",
      },
    },
  },
  render: () => <IconsGalleryPlayground />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = await canvas.findByRole("searchbox", { name: /Search icons/i });

    await userEvent.clear(search);
    await userEvent.type(search, "lock");

    const lockButton = await canvas.findByRole("button", { name: "Lock" });
    await userEvent.click(lockButton);

    await expect(await canvas.findByText("Selected: Lock")).toBeInTheDocument();
    await expect(await canvas.findByRole("button", { name: /Use Lock/ })).toBeInTheDocument();
  },
};

function IconsGalleryPlayground() {
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string>(() => ICONS[0]?.key ?? "");

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ICONS;
    return ICONS.filter((e) => e.name.toLowerCase().includes(q));
  }, [query]);

  const selected = useMemo(() => ICONS.find((e) => e.key === selectedKey) ?? ICONS[0], [selectedKey]);
  const SelectedIcon = selected?.Icon;

  return (
    <FoundationSection>
      <GroupLabel>Interactive icon inventory</GroupLabel>

      <div className="story-preview-card">
        <div className="story-stack">
          <div className="story-decorator">
            <div className="story-label">Search icons</div>
            <input
              role="searchbox"
              aria-label="Search icons"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search (e.g. lock, alert, shield)"
            />
          </div>

          <div className="story-comparison">
            <div className="story-comparison__column">
              <span className="story-comparison__label">Results</span>
              <div className="story-comparison__content">
                <TokenGrid>
                  {entries.slice(0, 36).map((entry) => {
                    const IconComponent = entry.Icon;
                    return (
                      <button
                        key={entry.key}
                        type="button"
                        className="icons-tile"
                        aria-selected={entry.key === selectedKey}
                        aria-label={entry.name}
                        onClick={() => setSelectedKey(entry.key)}
                      >
                        <IconComponent size={20} strokeWidth={2} />
                        <div className="story-label">{entry.name}</div>
                      </button>
                    );
                  })}
                </TokenGrid>
                {entries.length === 0 ? <div className="story-theme-rule-text">No matches.</div> : null}
              </div>
            </div>

            <div className="story-comparison__column">
              <span className="story-comparison__label story-comparison__label--do">Applied preview</span>
              <div className="story-comparison__content">
                <H2 tone="neutral">Selected: {selected?.name ?? "—"}</H2>
                <div className="story-stack story-stack--tight">
                  <Button
                    startIcon={SelectedIcon ? <SelectedIcon size={16} strokeWidth={2} /> : null}
                    type="button"
                  >
                    Use {selected?.name ?? ""}
                  </Button>
                  <InlineAlert
                    variant="info"
                    label="In an alert"
                    iconMode="dot"
                    compact
                    message={
                      SelectedIcon ? (
                        <span className="icons-applied-inline">
                          <SelectedIcon size={16} strokeWidth={2} />
                          <span>Icon + semantic surfaces keep UI consistent.</span>
                        </span>
                      ) : (
                        "Icon preview"
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FoundationSection>
  );
}

