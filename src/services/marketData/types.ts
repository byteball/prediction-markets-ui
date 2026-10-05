export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export interface PriceQuery {
  from: string;
  to: string;
}

export interface CandleQuery extends PriceQuery {
  isHourlyChart?: boolean;
  committed_at?: number;
}

export interface MarketDataQuery extends CandleQuery {
  proxyPreciousMetal?: boolean;
}

export interface MarketDataResult {
  candles: Candle[];
  currentValue: number;
  candlesSource: string | null;
  priceSource: string | null;
}

export type RawPrice = number | string | null;

export interface ProviderLike<CReq, CRes, PReq, PRes> {
  name: string;
  getCandles(req: CReq): Promise<CRes>;
  getPrice(req: PReq): Promise<PRes>;
}

export type Provider = ProviderLike<CandleQuery, Candle[], PriceQuery, RawPrice>;
