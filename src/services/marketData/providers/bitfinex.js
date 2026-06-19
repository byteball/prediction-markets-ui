import axios from "axios";

import { toCandle } from "../shared/normalizeCandle";

// Bitfinex public API (api-pub, keyless, CORS). Symbol-based pairs like "tBTCUSD".
// NOTE two gotchas handled here: timestamps are in MILLISECONDS, and the row
// order is OCHL (open, CLOSE, high, low) — not the usual OHLC.
const instance = axios.create({ baseURL: "https://api-pub.bitfinex.com/v2" });

const symbol = (from, to) => `t${from.toUpperCase()}${to.toUpperCase()}`;
const limitFor = (isHourlyChart) => (isHourlyChart ? 168 : 30);

export const bitfinexProvider = {
  name: "bitfinex",

  getCandles: async ({ from, to, isHourlyChart, committed_at }) => {
    const timeframe = isHourlyChart ? "1h" : "1D";
    const params = { limit: limitFor(isHourlyChart), sort: 1 }; // sort=1 -> ascending
    if (committed_at) params.end = committed_at * 1000;

    const { data } = await instance.get(`/candles/trade:${timeframe}:${symbol(from, to)}/hist`, { params });
    // Rows: [ MTS(ms), open, close, high, low, volume ]
    return (data || []).map(([mts, open, close, high, low]) => toCandle({ time: mts / 1000, open, high, low, close }));
  },

  getPrice: async ({ from, to }) => {
    const { data } = await instance.get(`/ticker/${symbol(from, to)}`);
    // Ticker array: [ BID, BID_SIZE, ASK, ASK_SIZE, DAILY_CHANGE, DAILY_CHANGE_REL, LAST_PRICE, ... ]
    return Array.isArray(data) ? data[6] ?? null : null;
  }
};
