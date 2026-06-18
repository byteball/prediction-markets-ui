/**
 * Decorator: time each provider call and log the outcome with the `[marketData]`
 * prefix. Counts/prices reflect the post-validation result (this wraps
 * withValidation), so logs show what the chain actually accepted.
 *
 * @param {{name:string, getCandles:Function, getPrice:Function}} provider
 * @returns {{name:string, getCandles:Function, getPrice:Function}}
 */
export const withLogging = (provider) => ({
  ...provider,
  getCandles: async (req) => {
    const startTime = Date.now();
    const candles = await provider.getCandles(req);
    const count = Array.isArray(candles) ? candles.length : 0;
    console.log(`[marketData] ${provider.name} candles: ${count ? `OK (count=${count})` : "EMPTY"} in ${Date.now() - startTime}ms`);
    return candles;
  },
  getPrice: async (req) => {
    const startTime = Date.now();
    const price = await provider.getPrice(req);
    console.log(`[marketData] ${provider.name} price: ${price != null ? `OK (price=${price})` : "EMPTY"} in ${Date.now() - startTime}ms`);
    return price;
  }
});
