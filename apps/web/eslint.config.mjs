import eslintPluginNext from "@next/eslint-plugin-next";
import eslintPluginTypescript from "@typescript-eslint/eslint-plugin";
import eslintParserTypescript from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@next/next": eslintPluginNext,
      "@typescript-eslint": eslintPluginTypescript,
    },
    languageOptions: {
      parser: eslintParserTypescript,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    plugins: {
      "@next/next": eslintPluginNext,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];
