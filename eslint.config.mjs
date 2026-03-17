import stylistic from "@stylistic/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [".expo/**", ".codex/**", "coverage/**", "dist/**", "mocks/**", "node_modules/**"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
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
    },
    rules: {
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
    },
  },
];
