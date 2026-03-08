import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { react, "react-hooks": reactHooks },
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
          patterns: [
            {
              // Why: enforce workspace boundaries and force shared extraction.
              group: [
                "*/miniapp/src/*",
                "*/admin/src/*",
                "miniapp/src/*",
                "admin/src/*",
                "../miniapp/src/*",
                "../admin/src/*",
                "../../miniapp/src/*",
                "../../admin/src/*",
              ],
              message:
                "Cross-workspace imports forbidden. Move shared code to @vpn-suite/shared or @shared/*.",
            },
          ],
        },
      ],
    },
  }
  ,
  {
    files: [
      "shared/src/ui/primitives/**/*.tsx",
      "shared/src/ui/composites/**/*.tsx",
    ],
    plugins: { react },
    rules: {
      "react/forbid-dom-props": ["error", { forbid: ["style"] }],
    },
  },
  {
    files: [
      "admin/src/components/**/*.tsx",
    ],
    plugins: { react },
    rules: {
      "react/forbid-dom-props": ["warn", { forbid: ["style"] }],
    },
  },
  {
    files: ["miniapp/src/**/*.tsx"],
    plugins: { react },
    rules: {
      "react/forbid-dom-props": ["error", { forbid: ["style"] }],
    },
  },
  {
    files: ["miniapp/src/pages/**/*.tsx", "miniapp/src/page-models/**/*.ts", "miniapp/src/page-models/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/design-system/components/*",
                "@/design-system/layouts/*",
                "@/design-system/page-recipes/*",
                "@/design-system/patterns/*",
                "@/design-system/primitives/*",
                "!@/design-system/patterns/FallbackScreen",
              ],
              message:
                "Import reusable UI from '@/design-system'. Only FallbackScreen may be imported from its direct pattern path.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["admin/src/features/**/*.tsx"],
    plugins: { react },
    rules: {
      // Dashboard visual guardrail: prefer tokenized CSS classes over inline styles.
      "react/forbid-dom-props": ["warn", { forbid: ["style"] }],
    },
  }
);
