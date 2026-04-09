import type { Meta } from "@storybook/react";
import type { ComponentDocProps } from "./components/ComponentDoc";

export interface ComponentMetaConfig {
  title: string;
  name: string;
  status?: ComponentDocProps["status"];
  description: string;
  whenToUse: string;
  importPath: string;
  version?: string;
  figma?: string;
  github?: string;
  accessibilityScore?: string | number;
}

/**
 * Standardizes the Storybook Meta config for component docs.
 * Use with CSF meta and pass doc config to MDX ComponentDoc.
 */
export function createComponentMeta<C>(
  component: C,
  config: ComponentMetaConfig & Record<string, unknown>
): Meta<typeof component> {
  const { name, description, whenToUse, importPath, status, version, figma, github, accessibilityScore, title, ...rest } = config;
  return {
    title,
    component,
    parameters: {
      docs: {
        description: {
          component: `${description}\n\n**When to use:** ${whenToUse}\n\n**Import:** \`import { ${name} } from "${importPath}";\``,
        },
      },
    },
    ...rest,
  } as Meta<typeof component>;
}
