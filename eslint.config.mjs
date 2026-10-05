import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['build', 'docs', 'node_modules', 'public']),
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Carried over from the CRA eslintConfig.
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    // Legacy JS files: keep the CRA-era relaxed rule set until they are migrated to TS.
    files: ['**/*.{js,jsx,cjs,mjs}'],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
    },
    rules: {
      'react-hooks/exhaustive-deps': 'off',
      'react-refresh/only-export-components': 'off',
      'no-useless-escape': 'off',
      'no-useless-constructor': 'off',
      'no-unused-vars': 'warn',
      // Rules that did not exist in the CRA-era config; surfaced as warnings, to be fixed when files move to TS.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'no-useless-assignment': 'warn',
      'no-extra-boolean-cast': 'warn',
    },
  },
]);
