/** Set Prism on global so prismjs component scripts can register. Must be imported before any prism-* components. */
import Prism from "prismjs";

const g = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : undefined);
if (g) (g as Record<string, unknown>).Prism = Prism;

export default Prism;
