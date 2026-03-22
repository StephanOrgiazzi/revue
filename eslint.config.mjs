import tsParser from "@typescript-eslint/parser";

import repoPlugin from "./eslint-repo-rules.mjs";

const CODE_FILES = ["**/*.{js,jsx,ts,tsx,mjs,cjs}"];
const SRC_FILES = ["src/**/*.{js,jsx,ts,tsx,mjs,cjs}"];

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
      repo: repoPlugin,
    },
    rules: {},
  },
  {
    files: SRC_FILES,
    rules: {
      "repo/import-boundaries": "error",
      "repo/screen-file-placement": "error",
      "repo/tsx-file-placement": "error",
    },
  },
];
