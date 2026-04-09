import type { Decorator } from "@storybook/react";

const DEFAULT_PADDING = 24;

export const withPadding: Decorator = (Story, context) => {
  const padding = (context.parameters?.padding as number | undefined) ?? DEFAULT_PADDING;
  return (
    <div style={{ padding: typeof padding === "number" ? padding : DEFAULT_PADDING }}>
      <Story />
    </div>
  );
};
