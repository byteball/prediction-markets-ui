import { CANDLE_PROVIDERS } from "./providers";
import { getCurrencyMarketData, getCurrencyPrice } from "./getCurrencyMarketData";

// Replace the provider registry with controllable fakes; the orchestrator still
// wraps them with the real decorators (validation/safety/logging/timeout).
// (jest.mock is hoisted above the imports by babel-jest.)
jest.mock("./providers", () => {
  const make = (name) => ({ name, getCandles: jest.fn(), getPrice: jest.fn() });
  const a = make("a");
  const b = make("b");
  return { __esModule: true, CANDLE_PROVIDERS: [a, b], PRICE_PROVIDERS: [a, b] };
});

const [providerA, providerB] = CANDLE_PROVIDERS;

const now = Math.floor(Date.now() / 1000);
const validCandles = (offset = 0) => [
  { time: now - 7200 - offset, open: 10, high: 12, low: 9, close: 11 },
  { time: now - 3600 - offset, open: 11, high: 13, low: 10, close: 12 }
];
const invalidCandles = [
  { time: now - 7200, open: 10, high: 8, low: 9, close: 11 }, // high < low
  { time: now - 3600, open: 11, high: 7, low: 10, close: 12 }
];

const req = { from: "BTC", to: "USD", isHourlyChart: true };

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  [providerA, providerB].forEach((p) => {
    p.getCandles.mockReset().mockResolvedValue([]);
    p.getPrice.mockReset().mockResolvedValue(null);
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("getCurrencyMarketData", () => {
  it("uses the first provider that returns data for both candles and price", async () => {
    providerA.getCandles.mockResolvedValue(validCandles());
    providerA.getPrice.mockResolvedValue(98000);

    const result = await getCurrencyMarketData(req);

    expect(result.candlesSource).toBe("a");
    expect(result.priceSource).toBe("a");
    expect(result.candles).toHaveLength(2);
    expect(result.currentValue).toBe(98000);
    expect(providerB.getCandles).not.toHaveBeenCalled();
  });

  it("falls through to the next provider when the first is empty", async () => {
    providerA.getCandles.mockResolvedValue([]);
    providerB.getCandles.mockResolvedValue(validCandles());
    providerA.getPrice.mockResolvedValue(null);
    providerB.getPrice.mockResolvedValue(123);

    const result = await getCurrencyMarketData(req);

    expect(result.candlesSource).toBe("b");
    expect(result.priceSource).toBe("b");
    expect(result.currentValue).toBe(123);
  });

  it("resolves candles and price independently (different sources allowed)", async () => {
    providerA.getCandles.mockResolvedValue(validCandles());
    providerA.getPrice.mockResolvedValue(null);
    providerB.getPrice.mockResolvedValue(456);

    const result = await getCurrencyMarketData(req);

    expect(result.candlesSource).toBe("a");
    expect(result.priceSource).toBe("b");
  });

  it("treats invalid candles as a miss and continues down the chain", async () => {
    providerA.getCandles.mockResolvedValue(invalidCandles);
    providerB.getCandles.mockResolvedValue(validCandles());

    const result = await getCurrencyMarketData(req);

    expect(result.candlesSource).toBe("b");
  });

  it("returns empty candles and zero price when no provider succeeds", async () => {
    const result = await getCurrencyMarketData(req);

    expect(result).toEqual({ candles: [], currentValue: 0, candlesSource: null, priceSource: null });
  });

  it("getCurrencyPrice resolves only the price through the chain", async () => {
    providerA.getPrice.mockResolvedValue(null);
    providerB.getPrice.mockResolvedValue(777);

    expect(await getCurrencyPrice(req)).toBe(777);
    expect(providerA.getCandles).not.toHaveBeenCalled();
  });
});
