import { store } from "store/store";
import { cacheSearchResult, selectSearchCache } from "store/slices/searchCacheSlice";

/** The slice of persisted search-cache state this resolver reads: `{ [provider]: { [symbol]: id } }`. */
type SearchCacheResults = Record<string, Record<string, string | undefined> | undefined>;

export interface IdResolverOptions {
  /** Provider name, used as the cache namespace. */
  provider: string;
  /** Pinned symbol -> id pairs (e.g. testnet-only tokens /search can't find). */
  overrides?: Record<string, string>;
  /** Performs the /search lookup. */
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

    // The store is still JavaScript (untyped selector); name the piece we read once, here.
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
