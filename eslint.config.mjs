import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tsParser = require("@typescript-eslint/parser");
const tseslint = require("@typescript-eslint/eslint-plugin");

const eslintConfig = [
  {
    ignores: [
      "**/.next/**",
      "coverage/**",
      "dist/**",
      "**/.vscode/**",
      ".vscode/**",
      "public/vega.js",
      "public/vega-lite.js",
      "public/vega-embed.js",
    ],
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
      "max-lines-per-function": [
        "error",
        {
          max: 40,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
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
          object: "test",
          property: "skip",
          message:
            "Do not commit skipped tests. Use test.fixme only when the test is intentionally deferred.",
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
