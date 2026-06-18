import axios from "axios";

import { store } from "store/store";
import { cacheSearchResult } from "store/slices/searchCacheSlice";
import { coingeckoProvider } from "./coingecko";
import { coinbaseProvider } from "./coinbase";
import { krakenProvider } from "./kraken";
import { bitstampProvider } from "./bitstamp";
import { bitfinexProvider } from "./bitfinex";
import { coinpaprikaProvider } from "./coinpaprika";

// One shared axios.get mock is returned by every axios.create() call (closure),
// so each provider's internal instance dispatches through it. (jest.mock is
// hoisted above the imports by babel-jest.)
jest.mock("axios", () => {
  const get = jest.fn();
  return { __esModule: true, default: { create: jest.fn(() => ({ get })) } };
});

// Stub the store the id resolver reads/writes (empty cache by default).
jest.mock("store/store", () => ({
  store: { getState: jest.fn(), dispatch: jest.fn() }
}));

const mockGet = axios.create().get;

beforeEach(() => {
  mockGet.mockReset();
  store.getState.mockReturnValue({ searchCache: { results: {} } });
  store.dispatch.mockReset();
});

// NOTE: the id resolvers memoise per module, so each test below uses a distinct
// symbol to keep the shared cache from interfering across tests.
describe("coingeckoProvider", () => {
  it("resolves the symbol via /search then requests hourly candles (days=7)", async () => {
    mockGet
      .mockResolvedValueOnce({ data: { coins: [{ id: "bitcoin", symbol: "BTC", market_cap_rank: 1 }] } })
      .mockResolvedValueOnce({ data: [[1700000000000, 10, 12, 9, 11]] }); // [ ts(ms), o, h, l, c ]

    const candles = await coingeckoProvider.getCandles({ from: "BTC", to: "USD", isHourlyChart: true });

    expect(mockGet).toHaveBeenNthCalledWith(1, "/search", { params: { query: "BTC" } });
    expect(mockGet).toHaveBeenNthCalledWith(2, "/coins/bitcoin/ohlc", { params: { vs_currency: "usd", days: 7 } });
    expect(candles).toEqual([{ time: 1700000000, open: 10, high: 12, low: 9, close: 11 }]);
    expect(store.dispatch).toHaveBeenCalledWith(cacheSearchResult({ provider: "coingecko", symbol: "BTC", key: "bitcoin" }));
  });

  it("uses the persisted id and skips /search", async () => {
    store.getState.mockReturnValue({ searchCache: { results: { coingecko: { ZED: "zed-id" } } } });
    mockGet.mockResolvedValueOnce({ data: { "zed-id": { usd: 9 } } });

    expect(await coingeckoProvider.getPrice({ from: "ZED", to: "USD" })).toBe(9);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith("/simple/price", { params: { ids: "zed-id", vs_currencies: "usd" } });
  });

  it("requests daily candles (days=30) for a daily chart", async () => {
    mockGet
      .mockResolvedValueOnce({ data: { coins: [{ id: "ethereum", symbol: "ETH", market_cap_rank: 2 }] } })
      .mockResolvedValueOnce({ data: [] });

    await coingeckoProvider.getCandles({ from: "ETH", to: "USD", isHourlyChart: false });

    expect(mockGet).toHaveBeenNthCalledWith(2, "/coins/ethereum/ohlc", { params: { vs_currency: "usd", days: 30 } });
  });

  it("picks the highest-market-cap coin among exact-symbol matches", async () => {
    mockGet
      .mockResolvedValueOnce({ data: { coins: [
        { id: "unicorn-token", symbol: "UNI", market_cap_rank: 4000 },
        { id: "uniswap", symbol: "UNI", market_cap_rank: 20 },
        { id: "universe", symbol: "UNIVERSE", market_cap_rank: 1 } // wrong symbol, ignored
      ] } })
      .mockResolvedValueOnce({ data: [[1700000000000, 1, 2, 0.5, 1.5]] });

    await coingeckoProvider.getCandles({ from: "UNI", to: "USD", isHourlyChart: true });

    expect(mockGet).toHaveBeenNthCalledWith(2, "/coins/uniswap/ohlc", expect.anything());
  });

  it("skips candles for a resolved market without resolving an id", async () => {
    const candles = await coingeckoProvider.getCandles({ from: "XRP", to: "USD", committed_at: 1700000000 });

    expect(candles).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("returns empty when /search finds no matching symbol", async () => {
    mockGet.mockResolvedValueOnce({ data: { coins: [] } });

    expect(await coingeckoProvider.getCandles({ from: "NOPE", to: "USD" })).toEqual([]);
    expect(mockGet).toHaveBeenCalledTimes(1); // only /search, no /ohlc
  });

  it("resolves the current price from /simple/price", async () => {
    mockGet
      .mockResolvedValueOnce({ data: { coins: [{ id: "cardano", symbol: "ADA", market_cap_rank: 8 }] } })
      .mockResolvedValueOnce({ data: { cardano: { usd: 0.45 } } });

    expect(await coingeckoProvider.getPrice({ from: "ADA", to: "USD" })).toBe(0.45);
    expect(mockGet).toHaveBeenNthCalledWith(2, "/simple/price", { params: { ids: "cardano", vs_currencies: "usd" } });
  });

  it("memoises the id so a symbol is searched only once", async () => {
    mockGet
      .mockResolvedValueOnce({ data: { coins: [{ id: "cachecoin", symbol: "CACHE", market_cap_rank: 1 }] } })
      .mockResolvedValue({ data: { cachecoin: { usd: 5 } } });

    await coingeckoProvider.getPrice({ from: "CACHE", to: "USD" });
    await coingeckoProvider.getPrice({ from: "CACHE", to: "USD" });

    expect(mockGet.mock.calls.filter((call) => call[0] === "/search")).toHaveLength(1);
  });
});

describe("coinbaseProvider", () => {
  it("maps and reverses candles to ascending order with the right columns", async () => {
    // rows newest-first: [ time, low, high, open, close, volume ]
    mockGet.mockResolvedValue({ data: [
      [1700003600, 9, 13, 10, 12, 5],
      [1700000000, 8, 12, 9, 11, 4]
    ] });

    const candles = await coinbaseProvider.getCandles({ from: "BTC", to: "USD", isHourlyChart: true });

    expect(mockGet).toHaveBeenCalledWith("/products/BTC-USD/candles", { params: { granularity: 3600 } });
    expect(candles).toEqual([
      { time: 1700000000, open: 9, high: 12, low: 8, close: 11 },
      { time: 1700003600, open: 10, high: 13, low: 9, close: 12 }
    ]);
  });

  it("anchors a resolved market with start/end ISO timestamps", async () => {
    mockGet.mockResolvedValue({ data: [] });
    await coinbaseProvider.getCandles({ from: "BTC", to: "USD", isHourlyChart: false, committed_at: 1700000000 });

    const params = mockGet.mock.calls[0][1].params;
    expect(params.granularity).toBe(86400);
    expect(params.end).toBe(new Date(1700000000 * 1000).toISOString());
    expect(params.start).toBe(new Date((1700000000 - 30 * 86400) * 1000).toISOString());
  });

  it("reads the current price from the ticker", async () => {
    mockGet.mockResolvedValue({ data: { price: "100.5" } });
    expect(await coinbaseProvider.getPrice({ from: "BTC", to: "USD" })).toBe("100.5");
    expect(mockGet).toHaveBeenCalledWith("/products/BTC-USD/ticker");
  });
});

describe("krakenProvider", () => {
  it("reads candles from the dynamic result key and slices to the limit", async () => {
    mockGet.mockResolvedValue({ data: { error: [], result: {
      XXBTZUSD: [[1700000000, "10", "12", "9", "11", "10.5", "1.0", 5]],
      last: 1700000000
    } } });

    const candles = await krakenProvider.getCandles({ from: "BTC", to: "USD", isHourlyChart: true });

    expect(mockGet).toHaveBeenCalledWith("/0/public/OHLC", { params: { pair: "XBTUSD", interval: 60 } });
    expect(candles).toEqual([{ time: 1700000000, open: 10, high: 12, low: 9, close: 11 }]);
  });

  it("returns empty/null when Kraken reports an error", async () => {
    mockGet.mockResolvedValue({ data: { error: ["EGeneral:Invalid"], result: {} } });
    expect(await krakenProvider.getCandles({ from: "BTC", to: "USD" })).toEqual([]);

    mockGet.mockResolvedValue({ data: { error: ["EGeneral:Invalid"], result: {} } });
    expect(await krakenProvider.getPrice({ from: "BTC", to: "USD" })).toBeNull();
  });

  it("reads last trade price from c[0]", async () => {
    mockGet.mockResolvedValue({ data: { error: [], result: { XXBTZUSD: { c: ["99.9", "1.0"] } } } });
    expect(await krakenProvider.getPrice({ from: "BTC", to: "USD" })).toBe("99.9");
  });
});

describe("bitstampProvider", () => {
  it("maps the ohlc list to candles", async () => {
    mockGet.mockResolvedValue({ data: { data: { ohlc: [
      { timestamp: "1700000000", open: "10", high: "12", low: "9", close: "11", volume: "1" }
    ] } } });

    const candles = await bitstampProvider.getCandles({ from: "BTC", to: "USD", isHourlyChart: false });

    expect(mockGet).toHaveBeenCalledWith("/ohlc/btcusd/", { params: { step: 86400, limit: 30 } });
    expect(candles).toEqual([{ time: 1700000000, open: 10, high: 12, low: 9, close: 11 }]);
  });

  it("reads the last price from the ticker", async () => {
    mockGet.mockResolvedValue({ data: { last: "50.5" } });
    expect(await bitstampProvider.getPrice({ from: "BTC", to: "USD" })).toBe("50.5");
    expect(mockGet).toHaveBeenCalledWith("/ticker/btcusd/");
  });
});

describe("bitfinexProvider", () => {
  it("handles millisecond timestamps and the OCHL column order", async () => {
    // [ MTS(ms), open, close, high, low, volume ]
    mockGet.mockResolvedValue({ data: [[1700000000000, 10, 11, 12, 9, 5]] });

    const candles = await bitfinexProvider.getCandles({ from: "BTC", to: "USD", isHourlyChart: true });

    expect(mockGet).toHaveBeenCalledWith("/candles/trade:1h:tBTCUSD/hist", { params: { limit: 168, sort: 1 } });
    expect(candles).toEqual([{ time: 1700000000, open: 10, high: 12, low: 9, close: 11 }]);
  });

  it("reads LAST_PRICE (index 6) from the ticker array", async () => {
    mockGet.mockResolvedValue({ data: [1, 2, 3, 4, 5, 6, 77.7, 8, 9, 10] });
    expect(await bitfinexProvider.getPrice({ from: "BTC", to: "USD" })).toBe(77.7);
  });
});

describe("coinpaprikaProvider", () => {
  it("never returns candles (price-only)", async () => {
    expect(await coinpaprikaProvider.getCandles({ from: "BTC", to: "USD" })).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("resolves the id via /search then returns the USD price", async () => {
    mockGet
      .mockResolvedValueOnce({ data: { currencies: [{ id: "btc-bitcoin", symbol: "BTC", rank: 1 }] } })
      .mockResolvedValueOnce({ data: { quotes: { USD: { price: 65000 } } } });

    expect(await coinpaprikaProvider.getPrice({ from: "BTC", to: "USD" })).toBe(65000);
    expect(mockGet).toHaveBeenNthCalledWith(1, "/search", { params: { q: "BTC", c: "currencies", limit: 25 } });
    expect(mockGet).toHaveBeenNthCalledWith(2, "/tickers/btc-bitcoin", { params: { quotes: "USD" } });
    expect(store.dispatch).toHaveBeenCalledWith(cacheSearchResult({ provider: "coinpaprika", symbol: "BTC", key: "btc-bitcoin" }));
  });

  it("returns null for non-USD quotes (no request) or unmapped symbols", async () => {
    expect(await coinpaprikaProvider.getPrice({ from: "ETH", to: "EUR" })).toBeNull();

    mockGet.mockResolvedValueOnce({ data: { currencies: [] } });
    expect(await coinpaprikaProvider.getPrice({ from: "AAPL", to: "USD" })).toBeNull();

    expect(mockGet).toHaveBeenCalledTimes(1); // only AAPL's /search
  });
});
