import { store } from "store/store";
import { cacheSearchResult, selectSearchCache } from "store/slices/searchCacheSlice";

/**
 * Build a memoised symbol -> id resolver for a provider. Resolution order:
 *   1. static overrides (e.g. testnet-only tokens /search can't find)
 *   2. persisted cache (Redux + localStorage, keyed by provider + symbol)
 *   3. in-flight promise (dedupe concurrent lookups within a session)
 *   4. fetcher() — on a positive result, persist { provider, symbol, key }
 *
 * Negative results are kept in-memory for the session only (so a coin added later
 * is retried next session); transient failures aren't cached at all.
 *
 * @param {Object} options
 * @param {string} options.provider - provider name, used as the cache namespace.
 * @param {Record<string,string>} [options.overrides] - pinned symbol -> id pairs.
 * @param {(symbol: string) => Promise<string|null>} options.fetcher - performs the /search lookup.
 * @returns {(symbol: string) => Promise<string|null>}
 */
export const createIdResolver = ({ provider, overrides = {}, fetcher }) => {
  const inFlight = new Map();

  return (symbol) => {
    const sym = symbol?.toUpperCase();
    if (!sym) return Promise.resolve(null);
    if (overrides[sym]) return Promise.resolve(overrides[sym]);

    const persisted = selectSearchCache(store.getState())?.[provider]?.[sym];
    if (persisted) return Promise.resolve(persisted);

    if (inFlight.has(sym)) return inFlight.get(sym);

    const lookup = Promise.resolve()
      .then(() => fetcher(symbol))
      .then((id) => {
        if (id) store.dispatch(cacheSearchResult({ provider, symbol: sym, key: id }));
        return id || null;
      })
      .catch(() => {
        inFlight.delete(sym); // transient failure — allow a retry on the next call
        return null;
      });

    inFlight.set(sym, lookup);
    return lookup;
  };
};
