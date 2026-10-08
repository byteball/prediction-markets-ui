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

// Legacy (pre-FSD) folders. They are ignored by the boundaries rules until the migration is over,
// so the strict rules apply to migrated code only while `yarn lint` stays green.
const LEGACY_PATHS = [
  'src/components/**',
  'src/forms/**',
  'src/modals/**',
  'src/hooks/**',
  'src/utils/**',
  'src/store/**',
  'src/services/**',
  'src/locale/**',
  'src/pages/*-page/**',
  'src/pages/index.ts',
  'src/pages/lazy.tsx',
  'src/app-config.ts',
  'src/bootstrap.ts',
  'src/router.tsx',
  'src/vite-env.d.ts',
];

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
    files: ['src/components/ui/**/*.tsx', 'src/shared/ui/**/*.tsx'],
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
      'boundaries/ignore': LEGACY_PATHS,
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
            // Transitional: legacy folders are reachable from anywhere until the migration finishes.
            { allow: { to: { element: { isIgnored: true } } } },
            // `shared` is reachable from every layer; it is organised by segments, not slices.
            { allow: { to: { element: { type: 'shared' } } } },
            // Inside one slice (or inside `app`) everything is reachable.
            { from: { element: { type: 'app' } }, allow: { to: { element: { type: 'app' } } } },
            ...SLICED_LAYERS.map(sameSlice),
            // A layer reaches the slices of lower layers through their public API only.
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
      // Enabled at the end of the migration, once no legacy folder is left.
      'boundaries/no-unknown-files': 'off',
      'boundaries/no-unknown-dependencies': 'off',
      'boundaries/no-ignored-dependencies': 'off',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: globals.node },
  },
]);
