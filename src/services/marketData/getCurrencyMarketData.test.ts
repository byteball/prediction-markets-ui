import { CANDLE_PROVIDERS } from "./providers";
import { getCurrencyMarketData, getCurrencyPrice } from "./getCurrencyMarketData";
import type { Candle, CandleQuery } from "./types";

// Replace the provider registry with controllable fakes; the orchestrator still
// wraps them with the real decorators (validation/safety/logging/timeout).
// (vi.mock is hoisted above the imports; the factory must not touch outer variables.)
vi.mock("./providers", () => {
  const make = (name: string) => ({ name, getCandles: vi.fn(), getPrice: vi.fn() });
  const a = make("a");
  const b = make("b");
  return { __esModule: true, CANDLE_PROVIDERS: [a, b], PRICE_PROVIDERS: [a, b] };
});

const [providerA, providerB] = CANDLE_PROVIDERS;

const now = Math.floor(Date.now() / 1000);
const validCandles = (offset = 0): Candle[] => [
  { time: now - 7200 - offset, open: 10, high: 12, low: 9, close: 11 },
  { time: now - 3600 - offset, open: 11, high: 13, low: 10, close: 12 }
];
const invalidCandles: Candle[] = [
  { time: now - 7200, open: 10, high: 8, low: 9, close: 11 }, // high < low
  { time: now - 3600, open: 11, high: 7, low: 10, close: 12 }
];

const req: CandleQuery = { from: "BTC", to: "USD", isHourlyChart: true };

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  [providerA, providerB].forEach((p) => {
    vi.mocked(p.getCandles).mockReset().mockResolvedValue([]);
    vi.mocked(p.getPrice).mockReset().mockResolvedValue(null);
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("getCurrencyMarketData", () => {
  it("uses the first provider that returns data for both candles and price", async () => {
    vi.mocked(providerA.getCandles).mockResolvedValue(validCandles());
    vi.mocked(providerA.getPrice).mockResolvedValue(98000);

    const result = await getCurrencyMarketData(req);

    expect(result.candlesSource).toBe("a");
    expect(result.priceSource).toBe("a");
    expect(result.candles).toHaveLength(2);
    expect(result.currentValue).toBe(98000);
    expect(providerB.getCandles).not.toHaveBeenCalled();
  });

  it("falls through to the next provider when the first is empty", async () => {
    vi.mocked(providerA.getCandles).mockResolvedValue([]);
    vi.mocked(providerB.getCandles).mockResolvedValue(validCandles());
    vi.mocked(providerA.getPrice).mockResolvedValue(null);
    vi.mocked(providerB.getPrice).mockResolvedValue(123);

    const result = await getCurrencyMarketData(req);

    expect(result.candlesSource).toBe("b");
    expect(result.priceSource).toBe("b");
    expect(result.currentValue).toBe(123);
  });

  it("resolves candles and price independently (different sources allowed)", async () => {
    vi.mocked(providerA.getCandles).mockResolvedValue(validCandles());
    vi.mocked(providerA.getPrice).mockResolvedValue(null);
    vi.mocked(providerB.getPrice).mockResolvedValue(456);

    const result = await getCurrencyMarketData(req);

    expect(result.candlesSource).toBe("a");
    expect(result.priceSource).toBe("b");
  });

  it("treats invalid candles as a miss and continues down the chain", async () => {
    vi.mocked(providerA.getCandles).mockResolvedValue(invalidCandles);
    vi.mocked(providerB.getCandles).mockResolvedValue(validCandles());

    const result = await getCurrencyMarketData(req);

    expect(result.candlesSource).toBe("b");
  });

  it("collapses intraday candles into one per day for the daily view", async () => {
    const DAY = 24 * 60 * 60;
    const day = 1700000000 - (1700000000 % DAY);
    vi.mocked(providerA.getCandles).mockResolvedValue([
      { time: day, open: 10, high: 12, low: 9, close: 11 },
      { time: day + 4 * 3600, open: 11, high: 15, low: 8, close: 13 }
    ]);

    const result = await getCurrencyMarketData({ from: "BTC", to: "USD", isHourlyChart: false });

    expect(result.candles).toEqual([{ time: day, open: 10, high: 15, low: 8, close: 13 }]);
    expect(result.candlesSource).toBe("a");
  });

  it("keeps intraday candles as-is for the hourly view", async () => {
    vi.mocked(providerA.getCandles).mockResolvedValue(validCandles());

    const result = await getCurrencyMarketData({ from: "BTC", to: "USD", isHourlyChart: true });

    expect(result.candles).toHaveLength(2);
  });

  it("returns empty candles and zero price when no provider succeeds", async () => {
    const result = await getCurrencyMarketData(req);

    expect(result).toEqual({ candles: [], currentValue: 0, candlesSource: null, priceSource: null });
  });

  it("maps precious-metal symbols to a tokenized proxy when proxyPreciousMetal is set", async () => {
    vi.mocked(providerA.getCandles).mockResolvedValue(validCandles());

    await getCurrencyMarketData({ from: "XAU", to: "BTC", isHourlyChart: true, proxyPreciousMetal: true });

    expect(providerA.getCandles).toHaveBeenCalledWith(expect.objectContaining({ from: "PAXG", to: "BTC" }));
  });

  it("leaves symbols untouched without the proxyPreciousMetal flag", async () => {
    vi.mocked(providerA.getCandles).mockResolvedValue(validCandles());

    await getCurrencyMarketData({ from: "XAU", to: "BTC", isHourlyChart: true });

    expect(providerA.getCandles).toHaveBeenCalledWith(expect.objectContaining({ from: "XAU", to: "BTC" }));
  });

  it("getCurrencyPrice resolves only the price through the chain", async () => {
    vi.mocked(providerA.getPrice).mockResolvedValue(null);
    vi.mocked(providerB.getPrice).mockResolvedValue(777);

    expect(await getCurrencyPrice(req)).toBe(777);
    expect(providerA.getCandles).not.toHaveBeenCalled();
  });
});
