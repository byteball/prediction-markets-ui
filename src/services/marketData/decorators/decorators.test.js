import { withValidation } from "./withValidation";
import { withSafety } from "./withSafety";
import { withLogging } from "./withLogging";
import { withTimeout } from "./withTimeout";

const now = Math.floor(Date.now() / 1000);
const validCandles = [
  { time: now - 7200, open: 10, high: 12, low: 9, close: 11 },
  { time: now - 3600, open: 11, high: 13, low: 10, close: 12 }
];

const makeProvider = (overrides = {}) => ({
  name: "test",
  getCandles: jest.fn(),
  getPrice: jest.fn(),
  ...overrides
});

let logSpy;
let errorSpy;

beforeEach(() => {
  logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
  jest.useRealTimers();
});

describe("withSafety", () => {
  it("converts a thrown error into the empty result", async () => {
    const provider = withSafety(makeProvider({
      getCandles: async () => { throw new Error("boom"); },
      getPrice: async () => { throw new Error("boom"); }
    }));

    await expect(provider.getCandles({})).resolves.toEqual([]);
    await expect(provider.getPrice({})).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("passes successful results through (normalising nullish candles)", async () => {
    const provider = withSafety(makeProvider({
      getCandles: async () => undefined,
      getPrice: async () => 5
    }));

    await expect(provider.getCandles({})).resolves.toEqual([]);
    await expect(provider.getPrice({})).resolves.toBe(5);
  });
});

describe("withValidation", () => {
  it("passes valid data through", async () => {
    const provider = withValidation(makeProvider({
      getCandles: async () => validCandles,
      getPrice: async () => 5
    }));

    await expect(provider.getCandles({})).resolves.toHaveLength(2);
    await expect(provider.getPrice({})).resolves.toBe(5);
  });

  it("turns invalid data into an empty result and logs INVALID", async () => {
    const provider = withValidation(makeProvider({
      getCandles: async () => [{ time: now, open: 10, high: 8, low: 9, close: 11 }], // high < low
      getPrice: async () => 0
    }));

    await expect(provider.getCandles({})).resolves.toEqual([]);
    await expect(provider.getPrice({})).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("INVALID"));
  });
});

describe("withLogging", () => {
  it("logs OK with a count and returns the value unchanged", async () => {
    const provider = withLogging(makeProvider({ getCandles: async () => validCandles, getPrice: async () => 7 }));

    await expect(provider.getCandles({})).resolves.toBe(validCandles);
    await expect(provider.getPrice({})).resolves.toBe(7);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("test candles: OK (count=2)"));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("test price: OK (price=7)"));
  });

  it("logs EMPTY for empty/null results", async () => {
    const provider = withLogging(makeProvider({ getCandles: async () => [], getPrice: async () => null }));

    await provider.getCandles({});
    await provider.getPrice({});
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("test candles: EMPTY"));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("test price: EMPTY"));
  });
});

describe("withTimeout", () => {
  it("falls back to the empty result when the provider hangs", async () => {
    jest.useFakeTimers();
    const provider = withTimeout(8000)(makeProvider({
      getCandles: () => new Promise(() => {}),
      getPrice: () => new Promise(() => {})
    }));

    const candlesPromise = provider.getCandles({});
    const pricePromise = provider.getPrice({});
    jest.advanceTimersByTime(8000);

    await expect(candlesPromise).resolves.toEqual([]);
    await expect(pricePromise).resolves.toBeNull();
  });

  it("returns the value when the provider resolves in time", async () => {
    jest.useFakeTimers();
    const provider = withTimeout(8000)(makeProvider({ getCandles: async () => validCandles, getPrice: async () => 5 }));

    await expect(provider.getCandles({})).resolves.toBe(validCandles);
    await expect(provider.getPrice({})).resolves.toBe(5);
  });
});
