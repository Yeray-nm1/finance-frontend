import js from "@eslint/js";
import ts from "typescript-eslint";

const eslintConfig = [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
