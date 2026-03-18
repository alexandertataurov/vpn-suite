import type { PropRow, PropTypeKind } from "../components/docs/PropsTable";

type ArgType = {
  name?: string;
  description?: string;
  control?: { type?: string };
  table?: {
    type?: { summary?: string };
    defaultValue?: { summary?: string };
    category?: string;
  };
};

type ArgTypes = Record<string, ArgType>;

const CONTROL_TO_KIND: Record<string, PropTypeKind> = {
  boolean: "boolean",
  number: "number",
  text: "string",
  select: "enum",
  object: "unknown",
  "react-element": "ReactNode",
  function: "function",
};

function inferTypeKind(arg: ArgType): PropTypeKind {
  const controlType = arg.control?.type;
  if (controlType && controlType in CONTROL_TO_KIND) {
    return CONTROL_TO_KIND[controlType];
  }
  const typeSummary = arg.table?.type?.summary?.toLowerCase() ?? "";
  if (typeSummary.includes("boolean")) return "boolean";
  if (typeSummary.includes("number")) return "number";
  if (typeSummary.includes("string")) return "string";
  if (typeSummary.includes("function") || typeSummary.includes("=>")) return "function";
  if (typeSummary.includes("reactnode") || typeSummary.includes("react.node")) return "ReactNode";
  if (typeSummary.includes("|") && !typeSummary.includes("=>")) return "enum";
  return "unknown";
}

export function argTypesToPropRows(
  argTypes: ArgTypes | Record<string, unknown> | undefined
): PropRow[] {
  if (argTypes == null || typeof argTypes !== "object") return [];

  return Object.entries(argTypes).map(([name, arg]) => {
    const a = arg as ArgType;
    const table = a.table;
    const typeSummary = table?.type?.summary ?? a.control?.type ?? "unknown";
    const defaultSummary = table?.defaultValue?.summary;
    const category = table?.category;

    return {
      name,
      type: typeSummary,
      typeKind: inferTypeKind(a),
      default: defaultSummary,
      required: false,
      description: a.description ?? undefined,
      category,
    };
  });
}
