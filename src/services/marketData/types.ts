// Shared types of the market-data service. Runtime shapes are unchanged from the
// JavaScript version; this file only names them.

/** One OHLC bar in the app's canonical shape. `time` is a unix timestamp in SECONDS. */
export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

/** Request for a current price: base/quote symbols (e.g. "BTC"/"USD"). */
export interface PriceQuery {
  from: string;
  to: string;
}

/** Request for candles: hourly (7d) vs daily (30d), optionally anchored at `committed_at` (unix seconds) for a resolved market. */
export interface CandleQuery extends PriceQuery {
  isHourlyChart?: boolean;
  committed_at?: number;
}

/** Public request of `getCurrencyMarketData`: a candle query plus the XAU/XAG -> PAXG/KAG proxy switch. */
export interface MarketDataQuery extends CandleQuery {
  proxyPreciousMetal?: boolean;
}

/** Result of `getCurrencyMarketData`. Sources are `null` when no provider succeeded (candles `[]`, price `0`). */
export interface MarketDataResult {
  candles: Candle[];
  currentValue: number;
  candlesSource: string | null;
  priceSource: string | null;
}

/** A price as a provider returns it: exchanges often serve numeric strings; `withValidation` coerces and validates. */
export type RawPrice = number | string | null;

/**
 * Structural provider shape the decorators operate on. Generic over the request and
 * result types of both methods so a wrapped provider keeps its own signature.
 */
export interface ProviderLike<CReq, CRes, PReq, PRes> {
  name: string;
  getCandles(req: CReq): Promise<CRes>;
  getPrice(req: PReq): Promise<PRes>;
}

/** A raw market-data source as registered in `providers/index.ts` (output not yet validated). */
export type Provider = ProviderLike<CandleQuery, Candle[], PriceQuery, RawPrice>;
