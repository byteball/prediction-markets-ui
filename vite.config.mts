import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    // Bare imports relative to src/ and the @/ alias come from tsconfig.app.json (baseUrl, paths).
    tsconfigPaths(),
    tailwindcss(),
    // obyte / counterstake-sdk (ethers 5, secp256k1, create-hash, ws) expect Node globals in the browser.
    nodePolyfills({
      include: ['buffer', 'process', 'events', 'util', 'stream', 'crypto'],
      globals: { Buffer: true, process: true, global: true },
    }),
  ],
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
