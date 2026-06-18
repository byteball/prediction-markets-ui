import { validateCandles } from "../shared/validateCandles";
import { validatePrice } from "../shared/validatePrice";

/**
 * Decorator: validate & sanitize a provider's output. Invalid data becomes
 * `[]` / `null` so the orchestrator falls through to the next source. A
 * non-empty-but-rejected response is logged as `INVALID` with the reason.
 *
 * @param {{name:string, getCandles:Function, getPrice:Function}} provider
 * @returns {{name:string, getCandles:Function, getPrice:Function}}
 */
export const withValidation = (provider) => ({
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
