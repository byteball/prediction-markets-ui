import type { ProviderLike } from "../types";

/**
 * Decorator: a provider must never throw out of the chain. Any error (network,
 * CORS, parse) is logged and converted to the empty result (`[]` / `null`) so
 * the orchestrator continues with the next source (Null Object pattern).
 */
export const withSafety = <CReq, CRes, PReq, PRes>(
  provider: ProviderLike<CReq, CRes, PReq, PRes>
): ProviderLike<CReq, NonNullable<CRes> | never[], PReq, NonNullable<PRes> | null> => ({
  ...provider,
  getCandles: async (req) => {
    try {
      return (await provider.getCandles(req)) || [];
    } catch (error) {
      console.error(`[marketData] ${provider.name} candles: ERROR`, (error as Partial<Error> | undefined)?.message || error);
      return [];
    }
  },
  getPrice: async (req) => {
    try {
      const price = await provider.getPrice(req);
      return price == null ? null : price;
    } catch (error) {
      console.error(`[marketData] ${provider.name} price: ERROR`, (error as Partial<Error> | undefined)?.message || error);
      return null;
    }
  }
});
