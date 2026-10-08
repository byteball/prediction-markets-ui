import { store } from "@/store/store";
import { cacheSearchResult, selectSearchCache } from "@/store/slices/search-cache-slice";

type SearchCacheResults = Record<string, Record<string, string | undefined> | undefined>;

export interface IdResolverOptions {
  provider: string;
  overrides?: Record<string, string>;
  fetcher: (symbol: string) => Promise<string | null>;
}

export type IdResolver = (symbol: string) => Promise<string | null>;

/**
 * Build a memoised symbol -> id resolver for a provider. Resolution order:
 *   1. static overrides (e.g. testnet-only tokens /search can't find)
 *   2. persisted cache (Redux + localStorage, keyed by provider + symbol)
 *   3. in-flight promise (dedupe concurrent lookups within a session)
 *   4. fetcher() — on a positive result, persist { provider, symbol, key }
 *
 * Negative results are kept in-memory for the session only (so a coin added later
 * is retried next session); transient failures aren't cached at all.
 */
export const createIdResolver = ({ provider, overrides = {}, fetcher }: IdResolverOptions): IdResolver => {
  const inFlight = new Map<string, Promise<string | null>>();

  return (symbol) => {
    const sym = symbol?.toUpperCase();
    if (!sym) return Promise.resolve(null);
    if (overrides[sym]) return Promise.resolve(overrides[sym]);

    const persisted = (selectSearchCache(store.getState()) as SearchCacheResults | undefined)?.[provider]?.[sym];
    if (persisted) return Promise.resolve(persisted);

    if (inFlight.has(sym)) return inFlight.get(sym)!;

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
