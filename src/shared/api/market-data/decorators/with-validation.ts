import { validateCandles } from "../shared/validate-candles";
import { validatePrice } from "../shared/validate-price";
import type { Candle, ProviderLike } from "../types";

/**
 * Decorator: validate & sanitize a provider's output. Invalid data becomes
 * `[]` / `null` so the orchestrator falls through to the next source. A
 * non-empty-but-rejected response is logged as `INVALID` with the reason.
 *
 * Accepts any raw output (the provider's results are not trusted) and narrows it
 * to the canonical `Candle[]` / `number | null`.
 */
export const withValidation = <CReq, PReq>(
  provider: ProviderLike<CReq, unknown, PReq, unknown>
): ProviderLike<CReq, Candle[], PReq, number | null> => ({
  ...provider,
  getCandles: async (req) => {
    const raw = await provider.getCandles(req);
    const { candles, reason } = validateCandles(raw);
    if (!candles.length && Array.isArray(raw) && raw.length) {
      console.error(`[marketData] ${provider.name} candles: INVALID (${reason})`);
    }
    return candles;
  },
  getPrice: async (req) => {
    const raw = await provider.getPrice(req);
    const price = validatePrice(raw);
    if (price === null && raw !== null && raw !== undefined) {
      console.error(`[marketData] ${provider.name} price: INVALID (${raw})`);
    }
    return price;
  }
});
