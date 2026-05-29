import eslintPluginNext from "@next/eslint-plugin-next";
import eslintPluginTypescript from "@typescript-eslint/eslint-plugin";
import eslintParserTypescript from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "node_modules/**",
      "next-env.d.ts",
      "jest.setup.js",
    ],
  },
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
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/rules-of-hooks": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["**/__tests__/**/*", "**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
