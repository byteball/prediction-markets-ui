import axios from "axios";

import { toCandle } from "../shared/normalizeCandle";
import type { Provider } from "../types";

// Bitstamp (public, keyless, CORS). Symbol-based pairs like "btcusd".
// OHLC supports step/limit and start/end (unix seconds), with up to 1000 candles
// of history → the most reliable anchor for resolved markets.
const instance = axios.create({ baseURL: "https://www.bitstamp.net/api/v2" });

interface BitstampOhlcRow {
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}
interface BitstampOhlcResponse {
  data?: { ohlc?: BitstampOhlcRow[] };
}
interface BitstampTicker {
  last?: string;
}

const pair = (from: string, to: string) => `${from}${to}`.toLowerCase();
const limitFor = (isHourlyChart?: boolean) => (isHourlyChart ? 168 : 30);

export const bitstampProvider: Provider = {
  name: "bitstamp",

  getCandles: async ({ from, to, isHourlyChart, committed_at }) => {
    const step = isHourlyChart ? 3600 : 86400;
    const limit = limitFor(isHourlyChart);
    const params: { step: number; limit: number; end?: number; start?: number } = { step, limit };

    if (committed_at) {
      params.end = committed_at;
      params.start = committed_at - limit * step;
    }

    const { data } = await instance.get<BitstampOhlcResponse>(`/ohlc/${pair(from, to)}/`, { params });
    // Response: { data: { ohlc: [ { timestamp, open, high, low, close, volume } ] } }, ascending, strings.
    return (data?.data?.ohlc || [])
      .map(({ timestamp, open, high, low, close }) => toCandle({ time: timestamp, open, high, low, close }));
  },

  getPrice: async ({ from, to }) => {
    const { data } = await instance.get<BitstampTicker>(`/ticker/${pair(from, to)}/`);
    return data?.last ?? null;
  }
};
