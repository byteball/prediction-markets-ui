import { createMigrate, type MigrationManifest, type PersistedState } from "redux-persist";
import storage from "redux-persist/lib/storage";

import { IS_TESTNET } from "@/shared/config/env";

/** Keys kept in localStorage. Each is owned by the slice that declares it (see app/store/root-reducer). */
export const PERSIST_WHITELIST = ["locale", "wallet", "marketView", "creationOrder", "reserveAsset", "searchCache"] as const;

export const PERSIST_VERSION = 4;

// The localStorage key is kept from the pre-FSD app so existing users keep their data.
export const PERSIST_KEY = `prediction${IS_TESTNET ? "-tn" : ""}314`;

/* eslint-disable @typescript-eslint/no-explicit-any -- persisted state has no static shape before migration */
type LegacySettings = {
  lang?: string | null;
  walletAddress?: string | null;
  priceOrOdds?: "price" | "odds";
  creationOrder?: unknown;
  reserveAssets?: Record<string, unknown>;
  reserveRates?: Record<string, number>;
  reserveRateUpdateTime?: number;
  baseOHLC?: { data: unknown[]; expireTs: number };
  sportsCalendar?: unknown[];
};

/**
 * v3 → v4: the single `settings` slice is split between its owners.
 * Missing fields get the slices' defaults; `sportsCalendar` was unused and is dropped.
 */
const splitSettings = (state: any): any => {
  const { settings, ...rest } = state ?? {};
  const legacy: LegacySettings = settings ?? {};

  return {
    ...rest,
    locale: { lang: legacy.lang ?? null },
    wallet: { address: legacy.walletAddress ?? null },
    marketView: { priceOrOdds: legacy.priceOrOdds ?? "odds" },
    creationOrder: { order: legacy.creationOrder ?? null },
    reserveAsset: {
      assets: legacy.reserveAssets ?? {},
      rates: legacy.reserveRates ?? {},
      rateUpdateTime: legacy.reserveRateUpdateTime ?? 0,
      baseOHLC: legacy.baseOHLC ?? { data: [], expireTs: 0 },
    },
  };
};

export const migrations: MigrationManifest = {
  4: (state: PersistedState) => splitSettings(state) as PersistedState,
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export const persistConfig = {
  key: PERSIST_KEY,
  version: PERSIST_VERSION,
  storage,
  whitelist: [...PERSIST_WHITELIST],
  migrate: createMigrate(migrations, { debug: false }),
};
