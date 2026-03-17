/**
 * Design system primitives — low-level layout and typography. No business logic.
 * Order: Layout → Separator → Typography.
 */

// —— Layout ——
export { Box } from "./Box";
export type { BoxProps } from "./Box";
export { Container } from "./Container";
export type {
  PrimitiveContainerProps,
  PrimitiveContainerPadding,
  PrimitiveContainerSize,
} from "./Container";
export { Inline } from "./Inline";
export type { InlineProps } from "./Inline";
export { PrimitivePanel as Panel } from "./Panel";
export type {
  PrimitivePanelProps,
  PrimitivePanelPadding,
  PrimitivePanelVariant,
} from "./Panel";
export { Stack } from "./Stack";
export type {
  PrimitiveStackProps,
  PrimitiveStackDirection,
  PrimitiveStackAlign,
  PrimitiveStackJustify,
} from "./Stack";

// —— Separator ——
export { Divider } from "./Divider";
export type {
  PrimitiveDividerProps,
  PrimitiveDividerOrientation,
  PrimitiveDividerTone,
} from "./Divider";

// —— Typography ——
export { Text } from "./typography/Text";
export type { TextProps, TextVariant, TextSize } from "./typography/Text";
export { Heading } from "./typography/Heading";
export type { HeadingProps } from "./typography/Heading";
