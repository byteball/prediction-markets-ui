import axios from "axios";

import { toCandle } from "../shared/normalizeCandle";

// Bitstamp (public, keyless, CORS). Symbol-based pairs like "btcusd".
// OHLC supports step/limit and start/end (unix seconds), with up to 1000 candles
// of history → the most reliable anchor for resolved markets.
const instance = axios.create({ baseURL: "https://www.bitstamp.net/api/v2" });

const pair = (from, to) => `${from}${to}`.toLowerCase();
const limitFor = (isHourlyChart) => (isHourlyChart ? 168 : 30);

export const bitstampProvider = {
  name: "bitstamp",

  getCandles: async ({ from, to, isHourlyChart, committed_at }) => {
    const step = isHourlyChart ? 3600 : 86400;
    const limit = limitFor(isHourlyChart);
    const params = { step, limit };

    if (committed_at) {
      params.end = committed_at;
      params.start = committed_at - limit * step;
    }

    const { data } = await instance.get(`/ohlc/${pair(from, to)}/`, { params });
    // Response: { data: { ohlc: [ { timestamp, open, high, low, close, volume } ] } }, ascending, strings.
    return (data?.data?.ohlc || [])
      .map(({ timestamp, open, high, low, close }) => toCandle({ time: timestamp, open, high, low, close }));
  },

  getPrice: async ({ from, to }) => {
    const { data } = await instance.get(`/ticker/${pair(from, to)}/`);
    return data?.last ?? null;
  }
};
