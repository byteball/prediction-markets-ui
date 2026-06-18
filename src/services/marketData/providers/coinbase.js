import axios from "axios";

import { toCandle } from "../shared/normalizeCandle";

// Coinbase Exchange (public, keyless, CORS). Symbol-based pairs like "BTC-USD".
// Candles support start/end (ISO, max 300 buckets) → can anchor resolved markets.
const instance = axios.create({ baseURL: "https://api.exchange.coinbase.com" });

const product = (from, to) => `${from.toUpperCase()}-${to.toUpperCase()}`;
const limitFor = (isHourlyChart) => (isHourlyChart ? 168 : 30);

export const coinbaseProvider = {
  name: "coinbase",

  getCandles: async ({ from, to, isHourlyChart, committed_at }) => {
    const granularity = isHourlyChart ? 3600 : 86400;
    const params = { granularity };

    if (committed_at) {
      const start = committed_at - limitFor(isHourlyChart) * granularity;
      params.start = new Date(start * 1000).toISOString();
      params.end = new Date(committed_at * 1000).toISOString();
    }

    const { data } = await instance.get(`/products/${product(from, to)}/candles`, { params });
    // Response rows: [ time(seconds), low, high, open, close, volume ], newest first.
    return (data || [])
      .map(([time, low, high, open, close]) => toCandle({ time, open, high, low, close }))
      .reverse();
  },

  getPrice: async ({ from, to }) => {
    const { data } = await instance.get(`/products/${product(from, to)}/ticker`);
    return data?.price ?? null;
  }
};
