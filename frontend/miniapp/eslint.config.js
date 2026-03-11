import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

function getJsxName(node) {
  if (node.type === "JSXIdentifier") return node.name;
  if (node.type === "JSXMemberExpression") return node.property.name;
  return null;
}

const local = {
  rules: {
    "no-manual-shell-in-page-stories": {
      meta: {
        type: "problem",
        docs: {
          description: "Page stories must mount through the shared viewport shell helper instead of rendering shell primitives directly.",
        },
        schema: [],
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            const name = getJsxName(node.name);
            if (!name) return;
            if (name === "HeaderZone" || name === "ScrollZone" || name === "ActionZone") {
              context.report({
                node,
                message:
                  "Page stories must not render {{name}} directly. Use the shared viewport-shell helper instead.",
                data: { name },
              });
            }
          },
        };
      },
    },
  },
};

/** Miniapp-local ESLint (flat config). Use from frontend/miniapp when running lint in isolation. */
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { react, "react-hooks": reactHooks, "jsx-a11y": jsxA11y, local },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { React: "readonly", JSX: "readonly" },
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "jsx-a11y/control-has-associated-label": "warn",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/design-system",
              importNames: ["FallbackScreen"],
              message:
                "Import FallbackScreen from '@/design-system/patterns/FallbackScreen' to avoid barrel chunk cycles.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.tsx"],
    plugins: { react },
    rules: {
      "react/forbid-dom-props": ["error", { forbid: ["style"] }],
    },
  },
  {
    files: ["src/design-system/stories/**/*.tsx", "src/storybook/**/*.tsx"],
    rules: {
      "react/forbid-dom-props": "off",
    },
  },
  {
    files: ["src/pages/**/*.tsx", "src/page-models/**/*.ts", "src/page-models/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/design-system/components/*",
                "@/design-system/layouts/*",
                "@/design-system/recipes/*",
                "@/design-system/patterns/*",
                "@/design-system/primitives/*",
                "!@/design-system/patterns/FallbackScreen",
              ],
              message:
                "Import reusable UI from '@/design-system'. Only FallbackScreen may be imported from its direct pattern path.",
            },
            {
              group: [
                // Miniapp pages must not reach into design-system CSS directly; use components/patterns instead.
                "@/design-system/styles/*",
              ],
              message: "Do not import design-system CSS directly in pages; compose layouts and patterns from '@/design-system' exports instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/pages/**/*.stories.tsx"],
    rules: {
      "local/no-manual-shell-in-page-stories": "error",
    },
  }
);
