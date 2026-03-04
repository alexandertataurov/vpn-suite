import type { Decorator } from "@storybook/react";

export const withBackground: Decorator = (Story, context) => {
  const token = (context.parameters?.background as string | undefined) ?? "--color-surface";
  const value = typeof document !== "undefined" ? getComputedStyle(document.documentElement).getPropertyValue(token).trim() || undefined : undefined;
  return (
    <div
      style={{
        background: value || `var(${token})`,
        padding: 24,
        minHeight: 120,
      }}
    >
      <Story />
    </div>
  );
};
