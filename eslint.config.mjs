import { globalIgnores } from "eslint/config";
import { fixupPluginRules } from "@eslint/compat";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

const eslintConfig = [
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    plugins: {
      react: fixupPluginRules(react),
      "react-hooks": fixupPluginRules(reactHooks),
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unknown-property": "off",
    },
    settings: {
      react: { version: "detect" },
    },
  },
  {
    plugins: {
      "jsx-a11y": jsxA11y,
      import: importPlugin,
    },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      "jsx-a11y/alt-text": ["warn", { elements: ["img"], img: ["Image"] }],
    },
    settings: {
      "import/resolver": { typescript: { alwaysTryTypes: true } },
    },
  },
  {
    files: ["**/*.ts?(x)", "**/*.mts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { sourceType: "module" },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": 1,
      "@typescript-eslint/no-unused-expressions": 1,
    },
  },
  nextPlugin.configs.recommended,
  nextPlugin.configs["core-web-vitals"],
];

export default eslintConfig;
