import type { Meta } from "@storybook/react";

/**
 * Factory for consistent story meta. Enforces title, tags, and optional description.
 */
export function createMeta<T extends { displayName?: string }>(
  options: {
    title: string;
    component: T;
    description?: string;
    tags?: string[];
  }
): Meta<T> {
  const { title, component, description, tags = ["autodocs"] } = options;
  return {
    title,
    component,
    tags,
    ...(description && {
      parameters: {
        docs: {
          description: {
            component: description,
          },
        },
      },
    }),
  } as unknown as Meta<T>;
}
