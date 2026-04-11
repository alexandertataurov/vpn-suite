/**
 * Miniapp design system — single entry for all UI.
 * Import from @/design-system or @ds.
 *
 * Build order (must respect dependency chain):
 * Foundations → Primitives → Components → Patterns → Recipes → Pages
 */
export * from "./foundations";
export * from "./primitives";
export * from "./components";
export * from "./patterns";
export * from "./recipes";
export * from "./layouts";
export * from "./icons";
export * from "./hooks";
export * from "./utils";

// Compatibility layer for older imports.
export * from "./core";
export * from "./compositions";
