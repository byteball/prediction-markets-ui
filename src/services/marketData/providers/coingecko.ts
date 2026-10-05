import axios from "axios";

import { toCandle } from "../shared/normalizeCandle";
import { createIdResolver } from "../shared/createIdResolver";
import type { Provider } from "../types";

// CoinGecko (public, keyless, CORS) — first in the chain. Addresses coins by an
// internal id (not ticker), resolved lazily via the public /search endpoint and
// cached (persisted). The free API has no historical anchor, so candles are
// skipped for resolved markets.
const instance = axios.create({ baseURL: "https://api.coingecko.com/api/v3" });

interface CoingeckoSearchCoin {
  id: string;
  symbol?: string;
  market_cap_rank?: number | null;
}
interface CoingeckoSearchResponse {
  coins?: CoingeckoSearchCoin[];
}
type CoingeckoOhlcRow = [ts: number, open: number, high: number, low: number, close: number];
type CoingeckoSimplePrice = Record<string, Record<string, number> | undefined>;

// REACT_APP_ENVIRONMENT distinguishes testnet from livenet.
const isTestnet = import.meta.env.REACT_APP_ENVIRONMENT === "testnet";

const resolveId = createIdResolver({
  provider: "coingecko",
  // symbols /search can't resolve (e.g. testnet-only tokens) -> pinned ids
  overrides: { ...(isTestnet ? { USDC3: "usd-coin" } : {}) },
  fetcher: async (symbol) => {
    const { data } = await instance.get<CoingeckoSearchResponse>("/search", { params: { query: symbol } });
    const matches = (data?.coins || []).filter((coin) => coin.symbol?.toUpperCase() === symbol.toUpperCase());
    const best = matches.sort((a, b) => (a.market_cap_rank ?? Infinity) - (b.market_cap_rank ?? Infinity))[0];
    return best?.id || null;
  }
});

export const coingeckoProvider: Provider = {
  name: "coingecko",

  getCandles: async ({ from, to, isHourlyChart, committed_at }) => {
    if (committed_at) return []; // free API can't anchor to a past window — let an exchange handle it
    const id = await resolveId(from);
    if (!id) return [];

    const { data } = await instance.get<CoingeckoOhlcRow[]>(`/coins/${id}/ohlc`, {
      params: { vs_currency: to.toLowerCase(), days: isHourlyChart ? 7 : 30 }
    });
    // rows: [ ts(ms), open, high, low, close ]
    return (data || []).map(([ts, open, high, low, close]) => toCandle({ time: ts / 1000, open, high, low, close }));
  },

  getPrice: async ({ from, to }) => {
    const id = await resolveId(from);
    if (!id) return null;

    const vs = to.toLowerCase();
    const { data } = await instance.get<CoingeckoSimplePrice>("/simple/price", { params: { ids: id, vs_currencies: vs } });
    return data?.[id]?.[vs] ?? null;
  }
};
