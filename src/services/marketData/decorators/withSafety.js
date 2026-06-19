/**
 * Decorator: a provider must never throw out of the chain. Any error (network,
 * CORS, parse) is logged and converted to the empty result (`[]` / `null`) so
 * the orchestrator continues with the next source (Null Object pattern).
 *
 * @param {{name:string, getCandles:Function, getPrice:Function}} provider
 * @returns {{name:string, getCandles:Function, getPrice:Function}}
 */
export const withSafety = (provider) => ({
  ...provider,
  getCandles: async (req) => {
    try {
      return (await provider.getCandles(req)) || [];
    } catch (error) {
      console.error(`[marketData] ${provider.name} candles: ERROR`, error?.message || error);
      return [];
    }
  },
  getPrice: async (req) => {
    try {
      const price = await provider.getPrice(req);
      return price == null ? null : price;
    } catch (error) {
      console.error(`[marketData] ${provider.name} price: ERROR`, error?.message || error);
      return null;
    }
  }
});
