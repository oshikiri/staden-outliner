import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tsParser = require("@typescript-eslint/parser");
const tseslint = require("@typescript-eslint/eslint-plugin");

const eslintConfig = [
  {
    ignores: ["coverage/**", "dist/**", "**/.vscode/**", ".vscode/**"],
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
      "@typescript-eslint": tseslint,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.{test,spec}.{js,jsx,ts,tsx}"],
    rules: {
      "max-lines-per-function": "off",
      "no-restricted-properties": [
        "error",
        {
          object: "test",
          property: "only",
          message: "Do not commit focused tests.",
        },
        {
          object: "it",
          property: "only",
          message: "Do not commit focused tests.",
        },
        {
          object: "it",
          property: "skip",
          message: "Do not commit skipped tests.",
        },
        {
          object: "describe",
          property: "only",
          message: "Do not commit focused test suites.",
        },
        {
          object: "describe",
          property: "skip",
          message: "Do not commit skipped test suites.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.name=/^(fit|fdescribe|xit|xdescribe)$/]",
          message: "Do not commit focused or skipped tests.",
        },
      ],
    },
  },
];

export default eslintConfig;
