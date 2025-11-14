// @ts-check

import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import globals from "globals";

export default defineConfig(
  globalIgnores(["dist/**/*", "**/*.js", "eslint.config.mjs"]),
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
			parserOptions: {
        projectService: true,
				ecmaFeatures: {
					jsx: true,
				},
			},
      globals: {
        ...globals.node,
      }
		},
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-floating-promises": "error",
    }
  }
);