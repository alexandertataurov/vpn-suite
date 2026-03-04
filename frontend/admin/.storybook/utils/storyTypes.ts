/** ArgType category for table metadata */
export type ArgCategory = "Appearance" | "Behavior" | "Content" | "Accessibility" | "Advanced";

export interface ArgTableConfig {
  type?: { summary: string };
  defaultValue?: { summary: string };
  category?: ArgCategory;
}
