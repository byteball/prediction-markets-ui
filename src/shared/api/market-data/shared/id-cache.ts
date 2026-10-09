/**
 * Persistent symbol -> provider id cache used by the id resolvers.
 *
 * The market-data service does not know where the cache lives: the default keeps ids in memory
 * for the session, and the app plugs a persisted implementation (Redux + localStorage) through
 * `setIdCache` at startup. Order does not matter — lookups read the current cache at call time.
 */
export type IdCache = {
  get(provider: string, symbol: string): string | undefined;
  set(provider: string, symbol: string, id: string): void;
};

export const createMemoryIdCache = (): IdCache => {
  const ids = new Map<string, string>();

  return {
    get: (provider, symbol) => ids.get(`${provider}:${symbol}`),
    set: (provider, symbol, id) => {
      ids.set(`${provider}:${symbol}`, id);
    },
  };
};

let currentIdCache: IdCache = createMemoryIdCache();

export const setIdCache = (cache: IdCache) => {
  currentIdCache = cache;
};

export const getIdCache = (): IdCache => currentIdCache;
