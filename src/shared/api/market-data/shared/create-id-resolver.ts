import { getIdCache } from "./id-cache";

export interface IdResolverOptions {
  provider: string;
  overrides?: Record<string, string>;
  fetcher: (symbol: string) => Promise<string | null>;
}

export type IdResolver = (symbol: string) => Promise<string | null>;

/**
 * Build a memoised symbol -> id resolver for a provider. Resolution order:
 *   1. static overrides (e.g. testnet-only tokens /search can't find)
 *   2. the pluggable cache (see id-cache.ts; persisted by the app, keyed by provider + symbol)
 *   3. in-flight promise (dedupe concurrent lookups within a session)
 *   4. fetcher() — on a positive result, store { provider, symbol, id } in the cache
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

    const cached = getIdCache().get(provider, sym);
    if (cached) return Promise.resolve(cached);

    if (inFlight.has(sym)) return inFlight.get(sym)!;

    const lookup = Promise.resolve()
      .then(() => fetcher(symbol))
      .then((id) => {
        if (id) getIdCache().set(provider, sym, id);
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
