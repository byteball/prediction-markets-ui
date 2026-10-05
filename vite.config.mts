import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const src = (p = '') => fileURLToPath(new URL(`./src/${p}`, import.meta.url));

// antd's dark theme (with the old craco-less modifyVars) is precompiled by scripts/build-antd-css.mjs
// into src/styles/antd.dark.layer.css and imported from src/index.css inside `@layer antd`.

// Bare imports relative to src/ (the old jsconfig "baseUrl": "src/").
// Mirrors tsconfig.app.json "baseUrl". Add an entry here when a new top-level src/ module is created.
const srcModules = [
  'appConfig',
  'bootstrap',
  'components',
  'forms',
  'hooks',
  'locale',
  'modals',
  'pages',
  'router',
  'services',
  'store',
  'utils',
];

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // obyte / counterstake-sdk (ethers 5, secp256k1, create-hash, ws) expect Node globals in the browser.
    nodePolyfills({
      include: ['buffer', 'process', 'events', 'util', 'stream', 'crypto'],
      globals: { Buffer: true, process: true, global: true },
    }),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: src() },
      ...srcModules.map((name) => ({
        find: new RegExp(`^${name}(?=/|$)`),
        replacement: src(name),
      })),
    ],
  },
  // Keep the CRA variable names so .env.testnet / .env.livenet stay unchanged.
  envPrefix: 'REACT_APP_',
  build: {
    // prophet-backend reads ../prediction-markets-ui/build/index.html for OG/SSR placeholders.
    outDir: 'build',
    emptyOutDir: true,
    // Matches package.json "browserslist": the Tailwind v4 floor.
    target: ['chrome111', 'edge111', 'firefox128', 'safari16.4'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    restoreMocks: true,
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
  },
});
