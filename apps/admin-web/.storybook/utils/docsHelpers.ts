import type { Meta } from "@storybook/react";

export type DocStatus = "stable" | "beta" | "deprecated" | "new";

export interface ComponentMetaConfig {
  title: string;
  name: string;
  status?: DocStatus;
  description: string;
  whenToUse: string;
  importPath: string;
  version?: string;
  category?: string;
  figma?: string;
  github?: string;
  since?: string;
  accessibilityScore?: string | number;
}

/**
 * Standardizes the Storybook Meta config for component docs.
 * Use with CSF meta and pass doc config to MDX ComponentHero / parameters.docs.hero.
 */
export function createComponentMeta<C>(
  component: C,
  config: ComponentMetaConfig & Record<string, unknown>
): Meta<typeof component> {
  const {
    name,
    description,
    whenToUse,
    importPath,
    status,
    version,
    figma,
    github,
    category,
    since,
    accessibilityScore,
    title,
    ...rest
  } = config;
  return {
    title,
    component,
    parameters: {
      docs: {
        description: {
          component: `${description}\n\n**When to use:** ${whenToUse}\n\n**Import:** \`import { ${name} } from "${importPath}";\``,
        },
        hero: {
          status: status ?? "stable",
          version,
          figma,
          github,
          category,
          since,
          importPath,
          accessibilityScore,
        },
      },
    },
    ...rest,
  } as Meta<typeof component>;
}

export interface StoryDescriptionFields {
  variant?: string;
  bestFor?: string;
  keyProps?: string;
  realWorldContext?: string;
  avoidWhen?: string;
}

/**
 * Builds a story-level description string from structured fields.
 */
export function createStoryDescription(fields: StoryDescriptionFields): string {
  const parts: string[] = [];
  if (fields.variant) parts.push(`**Variant:** ${fields.variant}`);
  if (fields.bestFor) parts.push(`**Best for:** ${fields.bestFor}`);
  if (fields.keyProps) parts.push(`**Key props:** ${fields.keyProps}`);
  if (fields.realWorldContext) parts.push(`**Real-world context:** ${fields.realWorldContext}`);
  if (fields.avoidWhen) parts.push(`**Avoid when:** ${fields.avoidWhen}`);
  return parts.join("\n\n");
}

export type PropTypeKind = "string" | "boolean" | "number" | "enum" | "function" | "ReactNode" | "unknown";

export interface ArgTypeRow {
  name: string;
  type: string;
  typeKind?: PropTypeKind;
  default?: string;
  required?: boolean;
  description?: string;
  category?: string;
}

/**
 * Creates an argTypes entry for a single prop (for use in meta.argTypes).
 */
export function createArgType(row: ArgTypeRow): Record<string, unknown> {
  const table: Record<string, unknown> = {
    type: { summary: row.type },
    category: row.category ?? "Props",
  };
  if (row.default !== undefined) table.defaultValue = { summary: row.default };
  return {
    description: row.description,
    control: row.typeKind === "boolean" ? "boolean" : row.typeKind === "enum" ? "select" : undefined,
    table,
  };
}

export interface UsageItemInput {
  type: "do" | "dont";
  label: string;
  children: React.ReactNode;
  explanation?: string;
}

/**
 * Creates a usage panel item (do or don't). Use with UsagePanel doItems/dontItems.
 */
export function createUsageItem(
  _type: "do" | "dont",
  label: string,
  node: React.ReactNode,
  explanation?: string
): { label: string; node: React.ReactNode; explanation?: string } {
  return { label, node, explanation };
}

export interface KeyboardEntryInput {
  key: string;
  action: string;
}

/**
 * Creates a keyboard table row.
 */
export function createKeyboardEntry(key: string, action: string): KeyboardEntryInput {
  return { key, action };
}
