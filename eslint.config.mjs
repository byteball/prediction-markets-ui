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
      // The forms keep their original useEffect + setState data flow.
      'react-hooks/set-state-in-effect': 'off',
      // lazyWithFallback returns a component, so files that export only its results are refresh-safe.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true, extraHOCs: ['lazyWithFallback'] }],
    },
  },
  {
    // shadcn components export variant helpers (cva) next to the component by convention.
    files: ['src/components/ui/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: globals.node },
  },
]);
