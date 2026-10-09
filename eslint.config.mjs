import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

// Feature-Sliced Design layers, top to bottom. A layer may import only from the layers below it.
const SLICED_LAYERS = ['pages', 'widgets', 'features', 'entities'];
const LAYERS_BELOW = {
  app: ['pages', 'widgets', 'features', 'entities'],
  pages: ['widgets', 'features', 'entities'],
  widgets: ['features', 'entities'],
  features: ['entities'],
};

const sameSlice = (type) => ({
  from: { element: { type } },
  allow: { to: { element: { type, captured: { slice: '{{ from.element.captured.slice }}' } } } },
});

const publicApiOf = (from, targets, entryPoints = 'index.ts') => ({
  from: { element: { type: from } },
  allow: { to: { element: { type: targets, fileInternalPath: entryPoints } } },
  message: 'Import slices of lower layers only through their public API (index.ts)',
});

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
    files: ['src/shared/ui/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // Architectural boundaries (Feature-Sliced Design).
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: './tsconfig.app.json' },
      },
      'boundaries/legacy-templates': false,
      'boundaries/include': ['src/**/*'],
      // Not part of any layer: the Vite type shim.
      'boundaries/ignore': ['src/vite-env.d.ts'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app', partialMatch: false },
        { type: 'pages', pattern: 'src/pages/*', capture: ['slice'], partialMatch: false },
        { type: 'widgets', pattern: 'src/widgets/*', capture: ['slice'], partialMatch: false },
        { type: 'features', pattern: 'src/features/*', capture: ['slice'], partialMatch: false },
        { type: 'entities', pattern: 'src/entities/*', capture: ['slice'], partialMatch: false },
        { type: 'shared', pattern: 'src/shared/*', capture: ['segment'], partialMatch: false },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            // npm packages and node built-ins are not restricted here.
            { allow: { to: { module: { origin: ['external', 'core'] } } } },
            // `shared` is reachable from every layer; it is organised by segments, not slices.
            { allow: { to: { element: { type: 'shared' } } } },
            // Inside one slice (or inside `app`) everything is reachable.
            { from: { element: { type: 'app' } }, allow: { to: { element: { type: 'app' } } } },
            ...SLICED_LAYERS.map(sameSlice),
            // A layer reaches the slices of lower layers through their public API only.
            // `model.ts` is a second entry for `app` (store assembly) so it does not pull UI into the entry chunk.
            publicApiOf('app', LAYERS_BELOW.app, ['index.ts', 'model.ts']),
            publicApiOf('pages', LAYERS_BELOW.pages),
            publicApiOf('widgets', LAYERS_BELOW.widgets),
            publicApiOf('features', LAYERS_BELOW.features),
            // Entities may reference each other only through the `@x` cross-import notation.
            {
              from: { element: { type: 'entities' } },
              allow: {
                to: {
                  element: {
                    type: 'entities',
                    captured: { slice: '!{{ from.element.captured.slice }}' },
                    fileInternalPath: '@x/{{ from.element.captured.slice }}.ts',
                  },
                },
              },
            },
          ],
        },
      ],
      // Every file under src belongs to a layer, and every local import resolves to one.
      'boundaries/no-unknown-files': 'error',
      'boundaries/no-unknown-dependencies': 'error',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: globals.node },
  },
]);
