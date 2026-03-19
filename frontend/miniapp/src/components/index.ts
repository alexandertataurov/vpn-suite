/**
 * App-layer components — product-specific patterns moved from design-system.
 * Import from @/components. Use design-system primitives and patterns for generic UI.
 *
 * Dead exports removed: CompactSummaryCard (shadowed by design-system), DangerZone, LimitStrip.
 * Dead module barrels gutted: heroes/*, cards/*.
 */
export * from "./checkout";
export * from "./connect-status";
export * from "./devices";
export * from "./onboarding";
export * from "./plan";
export * from "./referral";
export * from "./settings";
export * from "./BottomSheet";
export { SessionMissing } from "./SessionMissing";
export type { SessionMissingProps } from "./SessionMissing";
export { VpnBoundaryNote } from "./VpnBoundaryNote";
export type { VpnBoundaryNoteProps } from "./VpnBoundaryNote";
