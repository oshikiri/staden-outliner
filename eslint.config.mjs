import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { fixupConfigRules } from "@eslint/compat";

const eslintConfig = [
  {
    ignores: [
      "coverage/**",
      "public/vega.js",
      "public/vega-lite.js",
      "public/vega-embed.js",
    ],
  },
  ...fixupConfigRules(nextCoreWebVitals),
  ...fixupConfigRules(nextTypescript),
  {
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
    files: [
      "**/*.test.{js,jsx,ts,tsx}"
    ],
    rules: {
      "max-lines-per-function": "off",
    },
  },
];

export default eslintConfig;
