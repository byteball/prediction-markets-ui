import { validateCandles } from "./validateCandles";

const now = Math.floor(Date.now() / 1000);
const candle = (overrides = {}) => ({ time: now - 3600, open: 10, high: 12, low: 9, close: 11, ...overrides });

describe("validateCandles", () => {
  it("accepts a clean array and returns it sorted ascending with no reason", () => {
    const input = [candle({ time: now - 3600 }), candle({ time: now - 7200 })];
    const { candles, reason } = validateCandles(input);

    expect(candles).toHaveLength(2);
    expect(candles[0].time).toBe(now - 7200);
    expect(candles[1].time).toBe(now - 3600);
    expect(reason).toBeNull();
  });

  it("rejects a non-array", () => {
    expect(validateCandles(null).candles).toEqual([]);
    expect(validateCandles(undefined).candles).toEqual([]);
    expect(validateCandles("<html>error</html>").candles).toEqual([]);
    expect(validateCandles({}).candles).toEqual([]);
  });

  it("rejects an empty array", () => {
    expect(validateCandles([]).reason).toBe("not an array / empty");
  });

  it("coerces numeric strings (Bitstamp/Kraken)", () => {
    const input = [
      { time: String(now - 7200), open: "10", high: "12", low: "9", close: "11" },
      { time: String(now - 3600), open: "11", high: "13", low: "10", close: "12" }
    ];
    const { candles } = validateCandles(input);

    expect(candles).toHaveLength(2);
    expect(candles[0]).toEqual({ time: now - 7200, open: 10, high: 12, low: 9, close: 11 });
  });

  it("drops malformed rows but keeps the valid ones", () => {
    const input = [
      candle({ time: now - 7200 }),
      candle({ time: now - 3600, high: 8 }), // high < low and < open => invalid
      candle({ time: now - 1800 })
    ];
    const { candles, reason } = validateCandles(input);

    expect(candles).toHaveLength(2);
    expect(reason).toBe("dropped 1 bad rows");
  });

  it("rejects millisecond timestamps as out-of-range", () => {
    const input = [
      { time: now * 1000, open: 10, high: 12, low: 9, close: 11 },
      { time: (now - 3600) * 1000, open: 10, high: 12, low: 9, close: 11 }
    ];
    expect(validateCandles(input).candles).toEqual([]);
  });

  it("rejects non-positive prices", () => {
    const input = [candle({ time: now - 7200, low: 0 }), candle({ time: now - 3600, open: -1 })];
    expect(validateCandles(input).candles).toEqual([]);
  });

  it("rejects rows where high < low or high/low don't bound open/close", () => {
    expect(validateCandles([candle({ high: 12, low: 13 })]).candles).toEqual([]);
    expect(validateCandles([candle({ open: 99 })]).candles).toEqual([]); // open above high
  });

  it("de-duplicates by timestamp", () => {
    const input = [candle({ time: now - 3600 }), candle({ time: now - 3600 }), candle({ time: now - 7200 })];
    const { candles } = validateCandles(input);

    expect(candles).toHaveLength(2);
  });

  it("requires a minimum number of valid candles", () => {
    const { candles, reason } = validateCandles([candle()]);

    expect(candles).toEqual([]);
    expect(reason).toMatch(/kept 1 valid/);
  });
});
