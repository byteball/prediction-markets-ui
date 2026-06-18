// Public facade for the market-data service. Consumers import only from here;
// providers, decorators, orchestration and helpers are internal details.
export { getCurrencyMarketData, getCurrencyPrice } from "./getCurrencyMarketData";
