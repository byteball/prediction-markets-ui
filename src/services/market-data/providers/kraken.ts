import axios from "axios";

import { toCandle } from "../shared/normalize-candle";
import { toKrakenAsset } from "../shared/symbol-map";
import type { Provider } from "../types";

// Kraken (public, keyless, CORS). Uses non-standard asset codes (BTC->XBT) and
// renames pairs in the response, so the result key is read dynamically. REST OHLC
// is capped at ~720 candles and has no historical anchor → last-resort fallback.
const instance = axios.create({ baseURL: "https://api.kraken.com" });

type KrakenOhlcRow = [time: number, open: string, high: string, low: string, close: string, vwap: string, volume: string, count: number];
interface KrakenTickerEntry {
  c?: [string, string];
}
interface KrakenResponse<T> {
  error?: string[];
  result: Record<string, T>;
}

const pair = (from: string, to: string) => `${toKrakenAsset(from.toUpperCase())}${toKrakenAsset(to.toUpperCase())}`;
const resultKey = (result?: Record<string, unknown>) => Object.keys(result || {}).find((key) => key !== "last");
const limitFor = (isHourlyChart?: boolean) => (isHourlyChart ? 168 : 30);

export const krakenProvider: Provider = {
  name: "kraken",

  getCandles: async ({ from, to, isHourlyChart }) => {
    const interval = isHourlyChart ? 60 : 1440;
    const { data } = await instance.get<KrakenResponse<KrakenOhlcRow[]>>("/0/public/OHLC", { params: { pair: pair(from, to), interval } });
    if (data?.error?.length) return [];

    const key = resultKey(data?.result);
    const rows = key ? data.result[key] : [];
    // Rows: [ time(seconds), open, high, low, close, vwap, volume, count ], strings, ascending.
    return (rows || [])
      .map(([time, open, high, low, close]) => toCandle({ time, open, high, low, close }))
      .slice(-limitFor(isHourlyChart));
  },

  getPrice: async ({ from, to }) => {
    const { data } = await instance.get<KrakenResponse<KrakenTickerEntry>>("/0/public/Ticker", { params: { pair: pair(from, to) } });
    if (data?.error?.length) return null;

    const key = resultKey(data?.result);
    return key ? data.result[key]?.c?.[0] ?? null : null; // c = [ last trade price, lot volume ]
  }
};
