import { toCandle } from "./normalizeCandle";

describe("toCandle", () => {
  it("coerces every field to a number", () => {
    expect(toCandle({ time: "1700000000", open: "10", high: "12", low: "9", close: "11" }))
      .toEqual({ time: 1700000000, open: 10, high: 12, low: 9, close: 11 });
  });

  it("keeps already-numeric fields", () => {
    expect(toCandle({ time: 1700000000, open: 10, high: 12, low: 9, close: 11 }))
      .toEqual({ time: 1700000000, open: 10, high: 12, low: 9, close: 11 });
  });

  it("only keeps the canonical OHLC keys", () => {
    expect(Object.keys(toCandle({ time: 1, open: 1, high: 1, low: 1, close: 1, volume: 5 })))
      .toEqual(["time", "open", "high", "low", "close"]);
  });
});
