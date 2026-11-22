import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["index.html", "node_modules/**"] },
  {
    files: ["src/**/*.js"],
    languageOptions: { globals: globals.browser },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none" }],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-var": "error",
      "prefer-const": "warn",
      "max-lines-per-function": [
        "warn",
        { max: 100, skipBlankLines: true, skipComments: true },
      ],
      complexity: ["warn", 20],
    },
  },
  {
    files: ["src/engine.js"],
    rules: {
      "no-useless-assignment": "warn",
      "no-dupe-keys": "warn",
      "no-restricted-globals": [
        "error",
        "window",
        "document",
        "navigator",
        "requestAnimationFrame",
      ],
    },
  },
  {
    files: ["src/{core,sim,physics,ai}/**/*.js"],
    rules: {
      "no-restricted-globals": ["error", "window", "document"],
      "no-restricted-properties": [
        "error",
        { object: "Math", property: "random" },
        { object: "Date", property: "now" },
        { object: "performance", property: "now" },
      ],
    },
  },
];
