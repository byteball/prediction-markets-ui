import { CANDLE_PROVIDERS, PRICE_PROVIDERS } from "./providers";
import { withValidation } from "./decorators/withValidation";
import { withSafety } from "./decorators/withSafety";
import { withLogging } from "./decorators/withLogging";
import { withTimeout } from "./decorators/withTimeout";
import { bucketByDay } from "./shared/bucketByDay";
import { toPreciousMetalProxy } from "./shared/symbolMap";

const TIMEOUT_MS = 8000;

// Wrap a raw provider with the cross-cutting decorators (validation closest to
// the provider, timeout outermost). Done once per call site below.
const wrap = (provider) => withTimeout(TIMEOUT_MS)(withSafety(withLogging(withValidation(provider))));

/**
 * Walk the candle providers in order, returning the first non-empty result.
 * @returns {Promise<{candles: Array, candlesSource: string|null}>}
 */
const resolveCandles = async (req) => {
  for (const provider of CANDLE_PROVIDERS) {
    const candles = await wrap(provider).getCandles(req);
    if (candles.length) return { candles, candlesSource: provider.name };
  }
  return { candles: [], candlesSource: null };
};

/**
 * Walk the price providers in order, returning the first valid price.
 * @returns {Promise<{currentValue: number, priceSource: string|null}>}
 */
const resolvePrice = async (req) => {
  for (const provider of PRICE_PROVIDERS) {
    const price = await wrap(provider).getPrice(req);
    if (price != null) return { currentValue: price, priceSource: provider.name };
  }
  return { currentValue: 0, priceSource: null };
};

/**
 * Resolve candles + current price for a currency/crypto pair, trying CoinGecko
 * first and falling back through the other public providers. Candles and price
 * are resolved independently (each with its own fallback), in parallel. Never
 * throws — returns empty candles / `0` price when no source succeeds.
 *
 * @param {Object} req
 * @param {string} req.from - base symbol (e.g. "BTC").
 * @param {string} req.to - quote symbol (e.g. "USD").
 * @param {boolean} req.isHourlyChart - hourly candles when true, daily otherwise.
 * @param {number} [req.committed_at] - unix seconds to anchor a resolved market.
 * @param {boolean} [req.proxyPreciousMetal] - map XAU/XAG to a tokenized proxy (PAXG/KAG) before fetching.
 * @returns {Promise<{candles: Array, currentValue: number, candlesSource: string|null, priceSource: string|null}>}
 */
export const getCurrencyMarketData = async ({ from, to, isHourlyChart, committed_at, proxyPreciousMetal } = {}) => {
  const startTime = Date.now();
  // Precious-metal feeds (XAU/XAG) aren't crypto; fetch a tokenized 1:1 proxy (PAXG/KAG) instead.
  const reqFrom = proxyPreciousMetal ? toPreciousMetalProxy(from) : from;
  const reqTo = proxyPreciousMetal ? toPreciousMetalProxy(to) : to;
  console.log(`[marketData] resolving ${reqFrom}_${reqTo} (isHourly=${!!isHourlyChart}, committed_at=${committed_at || "live"})`);

  const req = { from: reqFrom, to: reqTo, isHourlyChart, committed_at };
  const [candleResult, priceResult] = await Promise.all([resolveCandles(req), resolvePrice(req)]);

  const { candlesSource } = candleResult;
  const { currentValue, priceSource } = priceResult;

  // The daily view labels the x-axis by date, so collapse intraday candles
  // (e.g. CoinGecko's 4h) into one candle per day. Exchange daily candles are unchanged.
  const candles = isHourlyChart ? candleResult.candles : bucketByDay(candleResult.candles);

  console.log(
    `[marketData] resolved ${reqFrom}_${reqTo} in ${Date.now() - startTime}ms — ` +
    `candles: ${candlesSource ? `${candlesSource} (${candles.length})` : "NONE"}, ` +
    `price: ${priceSource ? `${priceSource} (${currentValue})` : "NONE"}`
  );

  return { candles, currentValue, candlesSource, priceSource };
};

/**
 * Resolve only the current price through the provider chain (e.g. when candles
 * are served from cache). Returns a number (`0` when no source succeeds).
 *
 * @param {Object} req - same shape as {@link getCurrencyMarketData}.
 * @returns {Promise<number>}
 */
export const getCurrencyPrice = async ({ from, to } = {}) => {
  const { currentValue } = await resolvePrice({ from, to });
  return currentValue;
};
