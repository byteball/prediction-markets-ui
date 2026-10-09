import type { ProviderLike } from "../types";

/**
 * Decorator factory: cap each provider call at `ms`. A hung source resolves to
 * the empty result (`[]` / `null`) instead of stalling the whole chain. The
 * underlying request is not aborted, just ignored once it loses the race.
 *
 * Outermost wrapper — it sits above withSafety, so the raced promise never rejects.
 */
export const withTimeout = (ms: number) => <CReq, CRes, PReq, PRes>(
  provider: ProviderLike<CReq, CRes, PReq, PRes>
): ProviderLike<CReq, CRes | never[], PReq, PRes | null> => {
  const race = <T, F>(promise: Promise<T>, kind: string, fallback: F): Promise<T | F> => {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<F>((resolve) => {
      timer = setTimeout(() => {
        console.error(`[marketData] ${provider.name} ${kind}: TIMEOUT after ${ms}ms`);
        resolve(fallback);
      }, ms);
    });
    // clear the timer once the race settles so a successful call doesn't fire a late TIMEOUT
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  };

  return {
    ...provider,
    getCandles: (req) => race(provider.getCandles(req), "candles", []),
    getPrice: (req) => race(provider.getPrice(req), "price", null)
  };
};
