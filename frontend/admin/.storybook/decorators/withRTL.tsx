import type { Decorator } from "@storybook/react";

export const withRTL: Decorator = (Story) => {
  return (
    <div dir="rtl">
      <Story />
    </div>
  );
};
