// Public facade for the market-data service. Consumers import only from here;
// providers, decorators, orchestration and helpers are internal details.
export { getCurrencyMarketData, getCurrencyPrice } from "./get-currency-market-data";
export { setIdCache, createMemoryIdCache, type IdCache } from "./shared/id-cache";
export type { Candle, CandleQuery, MarketDataQuery, MarketDataResult, PriceQuery, Provider, ProviderLike, RawPrice } from "./types";
