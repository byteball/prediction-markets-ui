import type { PersistedState } from "redux-persist";

import { migrations, PERSIST_KEY, PERSIST_VERSION, PERSIST_WHITELIST, persistConfig } from "./persist";
import { rootReducer } from "./root-reducer";

type AnyState = Record<string, unknown>;

const v3State = {
  settings: {
    creationOrder: { status: "pending", creation_unit_id: "unit1", data: { oracle: "ORACLE", feed_name: "ETH_USD" } },
    walletAddress: "WALLETADDRESSXXXXXXXXXXXXXXXXXXX",
    reserveRates: { base: 30 },
    reserveRateUpdateTime: 1_700_000_000,
    reserveAssets: { base: { symbol: "GBYTE", decimals: 9 } },
    sportsCalendar: [],
    priceOrOdds: "price",
    baseOHLC: { data: [{ time: 1, open: 1, high: 1, low: 1, close: 1 }], expireTs: 1_700_001_000 },
    lang: "ru",
  },
  searchCache: { results: { coingecko: { BTC: "bitcoin" } } },
  _persist: { version: 3, rehydrated: true },
};

const migrateV4 = (state: unknown) => migrations[4]!(state as PersistedState) as AnyState;

describe("persist config", () => {
  it("keeps the pre-migration localStorage key and bumps the version", () => {
    expect(PERSIST_KEY).toMatch(/^prediction(-tn)?314$/);
    expect(PERSIST_VERSION).toBe(4);
    expect(persistConfig.version).toBe(4);
  });

  it("persists only slices that exist in the root reducer", () => {
    const reducerKeys = Object.keys(rootReducer(undefined, { type: "@@INIT" }));

    for (const key of PERSIST_WHITELIST) {
      expect(reducerKeys).toContain(key);
    }
    expect(PERSIST_WHITELIST).not.toContain("walletBalances");
    expect(PERSIST_WHITELIST).not.toContain("market");
  });
});

describe("migration v3 -> v4", () => {
  it("splits settings between its owners and keeps the other persisted slices", () => {
    const migrated = migrateV4(v3State);

    expect(migrated).toEqual({
      locale: { lang: "ru" },
      wallet: { address: "WALLETADDRESSXXXXXXXXXXXXXXXXXXX" },
      marketView: { priceOrOdds: "price" },
      creationOrder: { order: v3State.settings.creationOrder },
      reserveAsset: {
        assets: { base: { symbol: "GBYTE", decimals: 9 } },
        rates: { base: 30 },
        rateUpdateTime: 1_700_000_000,
        baseOHLC: v3State.settings.baseOHLC,
      },
      searchCache: v3State.searchCache,
      _persist: v3State._persist,
    });
    expect(migrated).not.toHaveProperty("settings");
    expect(migrated).not.toHaveProperty("sportsCalendar");
  });

  it("fills the defaults for an incomplete v3 state", () => {
    const migrated = migrateV4({ settings: { walletAddress: "W" }, _persist: { version: 3, rehydrated: true } });

    expect(migrated).toEqual({
      locale: { lang: null },
      wallet: { address: "W" },
      marketView: { priceOrOdds: "odds" },
      creationOrder: { order: null },
      reserveAsset: { assets: {}, rates: {}, rateUpdateTime: 0, baseOHLC: { data: [], expireTs: 0 } },
      _persist: { version: 3, rehydrated: true },
    });
  });

  it("produces defaults for an empty store", () => {
    const migrated = migrateV4({});

    expect(migrated.locale).toEqual({ lang: null });
    expect(migrated.wallet).toEqual({ address: null });
    expect(migrated.creationOrder).toEqual({ order: null });
  });

  it("yields a state the root reducer accepts as-is (rehydration keeps the migrated values)", () => {
    const migrated = migrateV4(v3State);
    const { _persist, ...persisted } = migrated;
    void _persist;
    const state = rootReducer({ ...rootReducer(undefined, { type: "@@INIT" }), ...persisted } as ReturnType<typeof rootReducer>, { type: "@@TEST" });

    expect(state.locale.lang).toBe("ru");
    expect(state.wallet.address).toBe("WALLETADDRESSXXXXXXXXXXXXXXXXXXX");
    expect(state.marketView.priceOrOdds).toBe("price");
    expect(state.creationOrder.order?.status).toBe("pending");
    expect(state.reserveAsset.rates).toEqual({ base: 30 });
    expect(state.searchCache.results).toEqual({ coingecko: { BTC: "bitcoin" } });
  });

  it("is not applied again to a state already at v4", async () => {
    const v4State = { ...migrateV4(v3State), _persist: { version: 4, rehydrated: true } };
    const result = await persistConfig.migrate(v4State as PersistedState, 4);

    expect(result).toBe(v4State);
  });

  it("runs through createMigrate for an inbound v3 state", async () => {
    const result = (await persistConfig.migrate(v3State as unknown as PersistedState, 4)) as AnyState;

    expect(result.locale).toEqual({ lang: "ru" });
    expect(result).not.toHaveProperty("settings");
  });

  it("skips migration for a fresh store without persisted state", async () => {
    expect(await persistConfig.migrate(undefined, 4)).toBeUndefined();
  });
});
