// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");
const tsEslint = require("@typescript-eslint/eslint-plugin");

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ["dist/*", "node_modules/*", "build/*"],
    plugins: {
      "@typescript-eslint": tsEslint,
    },
    rules: {
      // RN copy frequently contains apostrophes; avoid noisy lint failures
      "react/no-unescaped-entities": "off",
      // Allow underscore-prefixed unused vars for intentional placeholders
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // Prevent duplicate imports forever
      "no-duplicate-imports": "error",
      "import/no-duplicates": "error",
      // Block duplicate declarations (types, vars) even in TS
      "no-redeclare": "error",
      "@typescript-eslint/no-redeclare": "error",
    },
  },
]);
