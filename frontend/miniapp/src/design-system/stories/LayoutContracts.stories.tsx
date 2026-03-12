import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import {
  Button,
  Field,
  Input,
  PageScaffold,
  PageSection,
  SectionHeaderRow,
  SettingsActionRow,
  SettingsCard,
  StickyBottomBar,
  IconAlertTriangle,
  IconTrash2,
} from "@/design-system";
import { SafeAreaLayer } from "@/app/SafeAreaLayer";
import { Body, Caption } from "@/design-system";
import { PageFrame } from "@/design-system/layouts/PageFrame";
import { MobileFrame, ViewportShellProviders, ViewportShellRoutes, withViewportShell } from "@/storybook";
import { StoryCard, StoryPage, StorySection, ValuePill } from "./foundations.story-helpers";
import "./layout-story.css";

const meta = {
  title: "Layouts/Page Shell",
  tags: ["autodocs", "contract-test"],
  parameters: {
    docs: {
      description: {
        component:
          "Regression-anchor and contract stories for shell geometry, safe areas, destructive layouts, and real form behavior inside the miniapp viewport.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const DangerZoneLayout: Story = {
  decorators: [withViewportShell("tabbed", { initialEntries: ["/settings"] })],
  parameters: {
    chromatic: { viewports: [390] },
    docs: {
      description: {
        story:
          "Danger content stays at the bottom of the page, with lower-severity logout isolated from irreversible account deletion.",
      },
    },
  },
  render: () => (
    <PageScaffold className="page-shell--dense page-shell--sectioned">
      <PageSection title="Profile">
        <SettingsCard className="module-card settings-list-card">
          <SettingsActionRow
            icon={<IconAlertTriangle size={20} strokeWidth={1.6} />}
            title="Session alerts"
            description="Route health notices and recent account events."
            onClick={() => {}}
          />
        </SettingsCard>
      </PageSection>

      <div className="danger-zone-section">
        <PageSection>
          <SectionHeaderRow title="Account" />
          <SettingsCard className="module-card danger-zone-card" divider={false}>
            <div className="danger-zone-content">
              <span className="danger-zone-icon" aria-hidden>
                <IconAlertTriangle size={20} strokeWidth={1.8} />
              </span>
              <div>
                <Body as="div" className="op-name">Log out</Body>
                <Caption as="div" className="op-desc">Sign out on this device without changing your plan.</Caption>
              </div>
            </div>
          </SettingsCard>
        </PageSection>

        <PageSection>
          <SettingsCard className="module-card danger-zone-card" divider={false}>
            <SettingsActionRow
              icon={<IconTrash2 size={20} strokeWidth={1.6} />}
              title="Delete account"
              description="Permanently removes your account, devices, and billing history."
              tone="danger"
              onClick={() => {}}
            />
          </SettingsCard>
        </PageSection>
      </div>
    </PageScaffold>
  ),
};

export const StackFlowVsTabbed: Story = {
  render: () => (
    <div className="layout-story-mobile-grid">
      <ContractShellPreview
        label="Tabbed shell"
        variant="tabbed"
        initialEntries={["/settings"]}
        element={
          <PageFrame title="Settings" className="page-shell--dense page-shell--sectioned">
            <PageSection title="Route behavior" description="Bell remains available and the tab bar stays visible.">
              <SettingsCard className="module-card settings-list-card">
                <SettingsActionRow
                  icon={<IconAlertTriangle size={20} strokeWidth={1.6} />}
                  title="Primary destination"
                  description="Tab routes keep shell navigation persistent."
                  onClick={() => {}}
                />
              </SettingsCard>
            </PageSection>
          </PageFrame>
        }
      />
      <ContractShellPreview
        label="Stack shell"
        variant="stack"
        initialEntries={["/devices/issue"]}
        element={
          <PageFrame title="Device detail" className="page-shell--default page-shell--sectioned page-shell--devices" hideTrailingAction>
            <PageSection title="Route behavior" description="Stack routes rely on back navigation and hide tab chrome.">
              <SettingsCard className="module-card" divider={false}>
                <SettingsActionRow
                  icon={<IconAlertTriangle size={20} strokeWidth={1.6} />}
                  title="Sub-route flow"
                  description="Back affordance replaces destination-level shell controls."
                  onClick={() => {}}
                />
              </SettingsCard>
            </PageSection>
          </PageFrame>
        }
      />
    </div>
  ),
};

export const KeyboardRealInput: Story = {
  decorators: [withViewportShell("tabbed", { initialEntries: ["/settings"] })],
  tags: ["!chromatic"],
  parameters: {
    docs: {
      description: {
        story: "Tap the inputs on a real device to verify keyboard motion, focused-field visibility, and bottom-surface hiding.",
      },
    },
  },
  render: () => (
    <PageScaffold className="page-shell--dense page-shell--sectioned">
      <PageSection title="Device profile" description="Real inputs replace the old diagram-only keyboard demo.">
        <div className="layout-contracts-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <Field
              key={index}
              label={index === 0 ? "Device name" : `Field ${index + 1}`}
              description={index === 0 ? "Focus this first on a phone." : undefined}
            >
              <Input placeholder={index === 0 ? "e.g. MacBook Air" : "Value"} />
            </Field>
          ))}
        </div>
      </PageSection>
      <StickyBottomBar>
        <Button variant="primary" size="lg" className="layout-story-full-width-action">Save changes</Button>
      </StickyBottomBar>
    </PageScaffold>
  ),
};

export const SafeAreaContract: Story = {
  render: () => (
    <StoryPage
      eyebrow="Layouts"
      title="Safe area contract"
      summary="Each device class reserves a different amount of unusable top and bottom space. These values should match the CSS variables driving shell spacing."
      stats={[
        { label: "Profiles", value: "5" },
        { label: "Top token", value: "--safe-top" },
        { label: "Bottom token", value: "--safe-bottom" },
      ]}
    >
      <StorySection
        title="Device classes"
        description="Red is status-bar clearance, blue is home-indicator clearance, and green is usable content height."
      >
        <div className="layout-contracts-grid layout-contracts-grid--devices">
          {safeAreaDevices.map((device) => (
            <SafeAreaDevice key={device.name} {...device} />
          ))}
        </div>
      </StorySection>
    </StoryPage>
  ),
};

export const ScrollEdgeCases: Story = {
  render: () => (
    <div className="layout-story-mobile-grid">
      <ContractShellPreview label="< viewport height" variant="tabbed" initialEntries={["/settings"]} element={<ScrollContractPage rows={2} />} />
      <ContractShellPreview label="= viewport height" variant="tabbed" initialEntries={["/settings"]} element={<ScrollContractPage rows={5} />} />
      <ContractShellPreview label="> 3x viewport" variant="tabbed" initialEntries={["/settings"]} element={<ScrollContractPage rows={14} />} />
    </div>
  ),
};

export const ActionZoneDecisionTable: Story = {
  render: () => (
    <StoryPage
      eyebrow="Layouts"
      title="Action surface decisions"
      summary="Choose the bottom surface by ownership: shell-owned actions go in ActionZone, route-owned actions go in StickyBottomBar."
      stats={[
        { label: "Rule", value: "Ownership" },
        { label: "Shell action", value: "ActionZone" },
        { label: "Route action", value: "StickyBottomBar" },
      ]}
    >
      <StorySection title="Decision table" description="These are the cases that drift most often in page implementation review.">
        <div className="layout-contracts-table">
          {actionSurfaceRows.map((row) => (
            <div key={row.scenario} className="layout-contracts-table__row">
              <strong>{row.scenario}</strong>
              <div>Use: {row.surface}</div>
              <div>{row.reason}</div>
            </div>
          ))}
        </div>
      </StorySection>
    </StoryPage>
  ),
};

export const TabbedShell_Idle: Story = {
  decorators: [withViewportShell("tabbed", { initialEntries: ["/settings"] })],
  parameters: { chromatic: { viewports: [390, 430] } },
  render: () => <ShellAnchorPage title="Settings" rows={5} />,
};

export const StackShell_WithBackButton: Story = {
  decorators: [withViewportShell("stack", { initialEntries: ["/devices/issue"] })],
  parameters: { chromatic: { viewports: [390] } },
  render: () => <ShellAnchorPage title="Device detail" rows={4} detail />,
};

export const Shell_Fullscreen_iOS: Story = {
  decorators: [withViewportShell("tabbed", { initialEntries: ["/settings"] })],
  parameters: { chromatic: { viewports: [390] } },
  globals: {
    tgPlatform: "ios",
    tgFullscreen: "true",
  },
  render: () => <ShellAnchorPage title="Settings" rows={5} />,
};

function ContractShellPreview({
  element,
  initialEntries,
  label,
  variant,
}: {
  element: JSX.Element;
  initialEntries: string[];
  label: string;
  variant: "tabbed" | "stack";
}) {
  return (
    <div className="layout-story-mobile-preview">
      <Caption as="div" className="layout-story-mobile-label">{label}</Caption>
      <MobileFrame>
        <ViewportShellProviders>
          <SafeAreaLayer>
            <ViewportShellRoutes variant={variant} initialEntries={initialEntries}>
              <Route path="*" element={element} />
            </ViewportShellRoutes>
          </SafeAreaLayer>
        </ViewportShellProviders>
      </MobileFrame>
    </div>
  );
}

function ScrollContractPage({ rows }: { rows: number }) {
  return (
    <PageFrame title="Scroll contract" className="page-shell--dense page-shell--sectioned">
      <PageSection title="Rows" description="Short content should still leave the bottom chrome fixed and stable.">
        <div className="layout-contracts-grid">
          {Array.from({ length: rows }, (_, index) => (
            <SettingsCard key={index} className="module-card" divider={false}>
              <SettingsActionRow
                icon={<IconAlertTriangle size={20} strokeWidth={1.6} />}
                title={`State ${index + 1}`}
                description="ScrollZone owns overflow for this content block."
                onClick={() => {}}
              />
            </SettingsCard>
          ))}
        </div>
      </PageSection>
    </PageFrame>
  );
}

function ShellAnchorPage({
  detail = false,
  rows,
  title,
}: {
  detail?: boolean;
  rows: number;
  title: string;
}) {
  return (
    <PageFrame
      title={title}
      className={
        detail
          ? "page-shell--default page-shell--sectioned page-shell--devices"
          : "page-shell--dense page-shell--sectioned"
      }
      hideTrailingAction={detail}
    >
      <PageSection title="Regression anchor" description="This story exists to catch geometry shifts in shell padding and bottom action clearance.">
        <div className="layout-contracts-grid">
          {Array.from({ length: rows }, (_, index) => (
            <SettingsCard key={index} className="module-card" divider={false}>
              <SettingsActionRow
                icon={<IconAlertTriangle size={20} strokeWidth={1.6} />}
                title={`Anchor row ${index + 1}`}
                description={detail ? "Stack shell should keep back affordance visible." : "Tabbed shell should preserve bottom-nav clearance."}
                onClick={() => {}}
              />
            </SettingsCard>
          ))}
        </div>
        {!detail ? (
          <StickyBottomBar>
            <Button variant="primary" size="lg" className="layout-story-full-width-action">Continue</Button>
          </StickyBottomBar>
        ) : null}
      </PageSection>
    </PageFrame>
  );
}

function SafeAreaDevice({
  bottom,
  hasHomeIndicator,
  name,
  top,
}: {
  bottom: number;
  hasHomeIndicator: boolean;
  name: string;
  top: number;
}) {
  return (
    <div className="layout-contracts-device">
      <StoryCard title={name} caption={hasHomeIndicator ? "Home indicator device" : "No home indicator"}>
        <div className="layout-contracts-device__frame">
          <div className="layout-contracts-device__top" style={{ height: top }}>Top {top}px</div>
          <div className="layout-contracts-device__body" style={{ minHeight: `calc(100% - ${top + bottom}px)` }}>Usable area</div>
          <div className="layout-contracts-device__bottom" style={{ height: bottom }}>Bottom {bottom}px</div>
        </div>
      </StoryCard>
      <div className="layout-contracts-rules">
        <ValuePill value={`--safe-top: ${top}px`} tone="danger" />
        <ValuePill value={`--safe-bottom: ${bottom}px`} tone="accent" />
      </div>
    </div>
  );
}

const safeAreaDevices = [
  { name: "iPhone SE 3rd", top: 20, bottom: 0, hasHomeIndicator: false },
  { name: "iPhone 15", top: 59, bottom: 34, hasHomeIndicator: true },
  { name: "iPhone 15 Max", top: 59, bottom: 34, hasHomeIndicator: true },
  { name: "Android (nav)", top: 24, bottom: 0, hasHomeIndicator: false },
  { name: "Android (gest)", top: 24, bottom: 24, hasHomeIndicator: true },
];

const actionSurfaceRows = [
  {
    scenario: "Tab-destination primary CTA",
    surface: "ActionZone",
    reason: "The shell owns destination-level actions and keeps them visible across page content.",
  },
  {
    scenario: "Form submit button",
    surface: "StickyBottomBar",
    reason: "The action belongs to one route-local form and should scroll with that route context.",
  },
  {
    scenario: "Wizard next button",
    surface: "StickyBottomBar",
    reason: "Step-specific progression should not masquerade as global shell navigation.",
  },
  {
    scenario: "Global status or alert surface",
    surface: "ActionZone",
    reason: "Shell-owned visibility beats route-local placement when the message spans destinations.",
  },
];
