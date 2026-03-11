import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import {
  DataCell,
  DataGrid,
  ListCard,
  ListRow,
  OverflowActionMenu,
  SelectionCard,
  ServerCard,
  StatusChip,
  SupportActionList,
} from "../patterns";
import {
  IconBookOpen,
  IconBug,
  IconCircleX,
  IconDownload,
  IconMessageCircle,
  IconPencil,
} from "../icons";
import {
  StoryCard,
  StoryPage,
  StorySection,
  ThreeColumn,
  TwoColumn,
  UsageExample,
} from "./foundations.story-helpers";

const meta = {
  title: "Patterns/Cards and Data",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Cards and UI patterns package the miniapp's structured information surfaces: metadata grids, list rows, selectable cards, status chips, and utility actions.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function CardsUiStoryFrame({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={["/support"]}>
      <div style={{ display: "grid", gap: "var(--spacing-4)", maxWidth: 640 }}>{children}</div>
    </MemoryRouter>
  );
}

function DeviceListExample() {
  return (
    <ListCard title="Recent devices">
      <ListRow
        deviceType="macos"
        iconTone="g"
        title="MacBook Air"
        lastActiveAt={new Date(Date.now() - 14 * 60_000)}
        status="active"
        right={<StatusChip variant="active">Active</StatusChip>}
      />
      <ListRow
        deviceType="ios"
        iconTone="a"
        title="iPhone 15 Pro"
        status="needs_refresh"
        right={<StatusChip variant="pending">Pending</StatusChip>}
      />
      <ListRow
        deviceType="router"
        iconTone="r"
        title="Router gateway"
        lastActiveAt={new Date(Date.now() - 3 * 24 * 60 * 60_000)}
        status="offline"
        right={<StatusChip variant="offline">Offline</StatusChip>}
      />
    </ListCard>
  );
}

function UtilityActionsExample() {
  return (
    <div style={{ display: "grid", gap: "var(--spacing-4)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="type-meta">Device actions</div>
        <OverflowActionMenu
          ariaLabel="Device actions"
          items={[
            { id: "rename", label: "Rename device", icon: <IconPencil size={16} strokeWidth={1.8} /> },
            { id: "download", label: "Download config", icon: <IconDownload size={16} strokeWidth={1.8} /> },
            { id: "revoke", label: "Revoke access", icon: <IconCircleX size={16} strokeWidth={1.8} />, danger: true, dividerBefore: true },
          ]}
        />
      </div>
      <div className="type-meta">Support</div>
      <SupportActionList
        items={[
          {
            to: "/docs",
            title: "Open documentation",
            description: "Review connection setup and troubleshooting guidance",
            icon: <IconBookOpen size={18} strokeWidth={1.8} />,
          },
          {
            to: "/support",
            title: "Contact support",
            description: "Escalate blocked or billing-related issues",
            icon: <IconMessageCircle size={18} strokeWidth={1.8} />,
            tone: "amber",
          },
          {
            to: "/bug",
            title: "Report a bug",
            description: "Send logs to help us fix the issue.",
            icon: <IconBug size={18} strokeWidth={1.8} />,
            tone: "blue",
            iconTone: "blue",
          },
        ]}
      />
    </div>
  );
}

function SelectionPatternsExample() {
  const [selected, setSelected] = useState("Amsterdam");

  return (
    <div style={{ display: "grid", gap: "var(--spacing-3)" }}>
      <ServerCard
        name="Amsterdam"
        region="NL"
        avgPingMs={42}
        loadPercent={30}
        isCurrent={selected === "Amsterdam"}
        onSelect={() => setSelected("Amsterdam")}
      />
      <ServerCard
        name="Frankfurt"
        region="DE"
        avgPingMs={127}
        loadPercent={72}
        isCurrent={selected === "Frankfurt"}
        onSelect={() => setSelected("Frankfurt")}
      />
      <ServerCard
        name="Paris"
        region="FR"
        avgPingMs={380}
        loadPercent={98}
        isCurrent={selected === "Paris"}
        onSelect={() => setSelected("Paris")}
      />
    </div>
  );
}

function DataGridExample() {
  return (
    <DataGrid columns={2}>
      <DataCell label="Latency" value="127 ms" valueTone="green" cellType="latency" />
      <DataCell
        label="Plan"
        value="Business Annual (Unlimited Seats)"
        valueTone="teal"
        cellType="plan"
        tooltip="Business Annual (Unlimited Seats)"
      />
      <DataCell label="Status" value={<StatusChip variant="active">Healthy</StatusChip>} cellType="status" />
      <DataCell
        label="Public IP"
        value="2001:0db8:85a3:0000:0000:8a2e:0370:7334"
        valueTone="ip"
        cellType="ip"
        tooltip="2001:0db8:85a3:0000:0000:8a2e:0370:7334"
      />
    </DataGrid>
  );
}

function DataGridLoadingExample() {
  return (
    <DataGrid columns={2}>
      <DataCell label="Latency" value="" cellType="latency" loading />
      <DataCell label="Plan" value="" cellType="plan" loading />
      <DataCell label="Status" value="" cellType="status" loading />
      <DataCell label="Public IP" value="" cellType="ip" loading />
    </DataGrid>
  );
}

export const Default: Story = {
  tags: ["chromatic"],
  parameters: {
    chromatic: {
      viewports: [390, 768, 1280],
    },
  },
  render: () => (
    <MemoryRouter initialEntries={["/support"]}>
      <StoryPage
        eyebrow="Patterns"
        title="Cards and UI patterns"
        summary="These patterns cover the information surfaces users read and act on most often: metadata grids, status chips, list rows, selectable cards, and secondary action menus. The stories now document overflow, loading, threshold, and disabled-state behavior instead of only ideal-state mockups."
        stats={[
          { label: "Pattern groups", value: "7" },
          { label: "Stateful variants", value: "loading + stale + selected" },
          { label: "Story focus", value: "thresholds" },
        ]}
      >
        <StorySection
          title="Data and status surfaces"
          description="DataGrid and StatusChip define the metadata contract for cards and hero modules. Values can now handle overflow, loading, and stale states without pushing that logic into page code."
        >
          <ThreeColumn>
            <StoryCard title="Overflow-safe data grid" caption="Long plan names and IPv6 values truncate cleanly while preserving the full value in the tooltip.">
              <DataGridExample />
            </StoryCard>
            <StoryCard title="Loading grid" caption="Per-cell loading keeps card structure stable while live values resolve.">
              <DataGridLoadingExample />
            </StoryCard>
            <StoryCard title="Chip contract" caption="Status chips now use a fixed semantic mapping and consistent 24px sizing.">
              <div style={{ display: "flex", gap: "var(--spacing-2)", flexWrap: "wrap" }}>
                <StatusChip variant="active">Active</StatusChip>
                <StatusChip variant="paid">Paid</StatusChip>
                <StatusChip variant="info">Info</StatusChip>
                <StatusChip variant="pending">Pending</StatusChip>
                <StatusChip variant="offline">Offline</StatusChip>
                <StatusChip variant="blocked">Blocked</StatusChip>
              </div>
            </StoryCard>
          </ThreeColumn>
        </StorySection>

        <StorySection
          title="List and selection patterns"
          description="List rows now own device icon mapping and relative time formatting, and the selection pattern is reusable beyond servers."
        >
          <TwoColumn>
            <UsageExample title="Device rows in context" description="Device rows derive timestamps internally from `lastActiveAt` and reserve `needs_refresh` as a real status state instead of burying it in free-form subtitle copy.">
              <DeviceListExample />
            </UsageExample>
            <UsageExample title="Selection card language" description="SelectionCard is the generic base for selectable entities. ServerCard specializes it with latency and load thresholds.">
              <div style={{ display: "grid", gap: "var(--spacing-3)" }}>
                <SelectionCard
                  title="Business annual"
                  subtitle="$119 per year · 5 seats"
                  selected
                  actionLabel="Change plan"
                  metadata={
                    <DataGrid columns={1} layout="1xcol">
                      <DataCell label="Bandwidth" value="Unlimited" valueTone="green" />
                    </DataGrid>
                  }
                />
                <SelectionPatternsExample />
              </div>
            </UsageExample>
          </TwoColumn>
        </StorySection>

        <StorySection
          title="Utility and overflow actions"
          description="Secondary actions should be explicit about their canonical content. Overflow menus cover device/server actions, and support lists expose the always-available help routes."
        >
          <UsageExample title="Utility actions" description="This story documents the canonical device, server, and support action sets so downstream pages do not invent their own menu vocabulary.">
            <UtilityActionsExample />
          </UsageExample>
        </StorySection>
      </StoryPage>
    </MemoryRouter>
  ),
};

export const DataSurfaces: Story = {
  tags: ["chromatic"],
  render: () => (
    <CardsUiStoryFrame>
      <DataGridExample />
      <DataGrid columns={1} layout="1xcol">
        <DataCell
          label="Public IP"
          value="2001:0db8:85a3:0000:0000:8a2e:0370:7334"
          valueTone="ip"
          cellType="ip"
          stale
          tooltip="2001:0db8:85a3:0000:0000:8a2e:0370:7334"
        />
      </DataGrid>
      <DataGridLoadingExample />
    </CardsUiStoryFrame>
  ),
};

export const StatusChipVariants: Story = {
  render: () => (
    <CardsUiStoryFrame>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["active", "paid", "info", "pending", "offline", "blocked"] as const).map((variant) => (
          <StatusChip key={variant} variant={variant}>
            {variant}
          </StatusChip>
        ))}
      </div>
    </CardsUiStoryFrame>
  ),
};

export const StatusChipInContext: Story = {
  render: () => (
    <CardsUiStoryFrame>
      <DeviceListExample />
    </CardsUiStoryFrame>
  ),
};

export const SelectionPatterns: Story = {
  tags: ["chromatic"],
  render: () => (
    <CardsUiStoryFrame>
      <SelectionPatternsExample />
    </CardsUiStoryFrame>
  ),
};

export const LoadThresholds: Story = {
  tags: ["chromatic"],
  parameters: {
    chromatic: {
      viewports: [390, 768],
    },
  },
  render: () => (
    <CardsUiStoryFrame>
      <ServerCard name="Frankfurt" region="DE" avgPingMs={45} loadPercent={30} onSelect={() => undefined} />
      <ServerCard name="Amsterdam" region="NL" avgPingMs={127} loadPercent={72} onSelect={() => undefined} />
      <ServerCard name="London" region="UK" avgPingMs={210} loadPercent={88} onSelect={() => undefined} />
      <ServerCard name="Paris" region="FR" avgPingMs={380} loadPercent={98} onSelect={() => undefined} />
    </CardsUiStoryFrame>
  ),
};

export const Loading: Story = {
  render: () => (
    <CardsUiStoryFrame>
      <DataGridLoadingExample />
      <ListCard title="Recent devices">
        <ListRow deviceType="macos" iconTone="n" title="Resolving device" subtitle="Loading…" />
        <ListRow deviceType="ios" iconTone="n" title="Resolving device" subtitle="Loading…" />
      </ListCard>
      <ServerCard name="Resolving server" region="--" loading onSelect={() => undefined} />
    </CardsUiStoryFrame>
  ),
};

export const UtilityActions: Story = {
  render: () => (
    <CardsUiStoryFrame>
      <UtilityActionsExample />
    </CardsUiStoryFrame>
  ),
};
