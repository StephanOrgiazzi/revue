import stylistic from "@stylistic/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import perfectionist from "eslint-plugin-perfectionist";

import repoPlugin from "./eslint-repo-rules.mjs";

const CODE_FILES = ["**/*.{js,jsx,ts,tsx,mjs,cjs}"];
const SRC_FILES = ["src/**/*.{js,jsx,ts,tsx,mjs,cjs}"];
const TEST_FILES = ["**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}"];

const PARENT_RELATIVE_IMPORTS = [
  "../*",
  "../../*",
  "../../../*",
  "../../../../*",
  "../../../../../*",
];

const baseRules = {
  "@stylistic/padding-line-between-statements": [
    "warn",
    {
      blankLine: "any",
      prev: "singleline-const",
      next: "singleline-const",
    },
    {
      blankLine: "always",
      prev: "multiline-const",
      next: "const",
    },
    {
      blankLine: "always",
      prev: "const",
      next: "multiline-const",
    },
  ],
  curly: ["error", "all"],
  eqeqeq: ["error", "always"],
  "max-lines": [
    "error",
    {
      max: 500,
      skipBlankLines: true,
      skipComments: true,
    },
  ],
  "no-console": ["error", { allow: ["warn", "error"] }],
  "no-eval": "error",
  "no-new-func": "error",
  "no-warning-comments": [
    "error",
    {
      terms: ["todo", "fixme", "hack", "xxx"],
      location: "anywhere",
    },
  ],
  "perfectionist/sort-imports": [
    "error",
    {
      environment: "bun",
      type: "natural",
      order: "asc",
      groups: [
        "type-import",
        ["value-builtin", "value-external"],
        "type-internal",
        "value-internal",
        ["type-parent", "type-sibling", "type-index"],
        ["value-parent", "value-sibling", "value-index"],
        "ts-equals-import",
        "unknown",
      ],
    },
  ],
  "perfectionist/sort-modules": [
    "error",
    {
      type: "natural",
      order: "asc",
      groups: [
        ["declare-interface", "declare-type"],
        ["export-interface", "export-type"],
        ["interface", "type"],
        "declare-enum",
        "export-enum",
        "enum",
        "declare-class",
        "class",
        "export-class",
        "declare-function",
        "export-function",
        "function",
      ],
    },
  ],
};

export default [
  {
    ignores: [".expo/**", ".codex/**", "coverage/**", "dist/**", "mocks/**", "node_modules/**"],
  },
  {
    files: CODE_FILES,
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@stylistic": stylistic,
      perfectionist,
      repo: repoPlugin,
    },
    rules: baseRules,
  },
  {
    files: SRC_FILES,
    rules: {
      "repo/hook-file-placement": "error",
      "repo/import-boundaries": "error",
      "repo/prefer-types-file": "error",
      "repo/screen-file-placement": "error",
      "repo/test-file-placement": "error",
      "repo/tsx-file-placement": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: PARENT_RELATIVE_IMPORTS,
              message: "Use the @/ alias for cross-module imports inside src.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportDefaultDeclaration",
          message: "Use named exports in src. Expo Router files under app/ are the only exception.",
        },
        {
          selector: "ExportAllDeclaration",
          message: "Barrel exports are banned. Import from the concrete module instead.",
        },
        {
          selector: "ExportNamedDeclaration[source]",
          message: "Re-export barrels are banned. Import from the concrete module instead.",
        },
        {
          selector: "ExportNamedDeclaration[exportKind='type'][source=null][declaration=null]",
          message:
            "Type re-export specifiers are banned. Import types directly from their concrete types.ts module.",
        },
      ],
    },
  },
  {
    files: SRC_FILES,
    ignores: TEST_FILES,
    rules: {
      "max-lines-per-function": [
        "error",
        {
          max: 190,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
    },
  },
];
