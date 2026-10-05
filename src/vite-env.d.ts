/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly REACT_APP_ENVIRONMENT?: 'testnet' | 'livenet' | 'devnet';
  readonly REACT_APP_FACTORY_AAS?: string;
  readonly REACT_APP_BACKEND_URL?: string;
  readonly REACT_APP_BASE_AAS?: string;
  readonly REACT_APP_SPORT_ORACLE?: string;
  readonly REACT_APP_CURRENCY_ORACLE?: string;
  readonly REACT_APP_PRECIOUS_METAL_ORACLE?: string;
  readonly REACT_APP_GA_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Untyped third-party packages.
declare module 'obyte';
declare module 'counterstake-sdk';
