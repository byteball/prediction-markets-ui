import axios from "axios";

import { createIdResolver } from "../shared/createIdResolver";

// Coinpaprika (public, keyless, CORS) — PRICE-ONLY fallback. Free-tier OHLC is
// limited to a single day, so it's not used for candles. Coins are addressed by
// an internal id, resolved lazily via /search (best rank wins) and cached
// (persisted). Only USD quotes are served.
const instance = axios.create({ baseURL: "https://api.coinpaprika.com/v1" });

const resolveId = createIdResolver({
  provider: "coinpaprika",
  fetcher: async (symbol) => {
    const { data } = await instance.get("/search", { params: { q: symbol, c: "currencies", limit: 25 } });
    const matches = (data?.currencies || []).filter((coin) => coin.symbol?.toUpperCase() === symbol.toUpperCase());
    const best = matches.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))[0];
    return best?.id || null;
  }
});

export const coinpaprikaProvider = {
  name: "coinpaprika",

  getCandles: async () => [],

  getPrice: async ({ from, to }) => {
    if (to.toUpperCase() !== "USD") return null;
    const id = await resolveId(from);
    if (!id) return null;

    const { data } = await instance.get(`/tickers/${id}`, { params: { quotes: "USD" } });
    return data?.quotes?.USD?.price ?? null;
  }
};
