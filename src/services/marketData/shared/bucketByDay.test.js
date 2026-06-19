import { bucketByDay } from "./bucketByDay";

const DAY = 24 * 60 * 60;
const day1 = 1700000000 - (1700000000 % DAY); // a UTC midnight
const day2 = day1 + DAY;

describe("bucketByDay", () => {
  it("collapses intraday candles into one candle per UTC day", () => {
    const candles = [
      { time: day1 + 0 * 3600, open: 10, high: 12, low: 9, close: 11 },
      { time: day1 + 4 * 3600, open: 11, high: 15, low: 8, close: 13 },
      { time: day1 + 8 * 3600, open: 13, high: 14, low: 7, close: 9 }
    ];

    expect(bucketByDay(candles)).toEqual([
      { time: day1, open: 10, high: 15, low: 7, close: 9 } // open=first, close=last, high=max, low=min
    ]);
  });

  it("keeps separate days separate and ascending", () => {
    const candles = [
      { time: day1 + 4 * 3600, open: 10, high: 12, low: 9, close: 11 },
      { time: day2 + 4 * 3600, open: 20, high: 22, low: 19, close: 21 }
    ];

    expect(bucketByDay(candles)).toEqual([
      { time: day1, open: 10, high: 12, low: 9, close: 11 },
      { time: day2, open: 20, high: 22, low: 19, close: 21 }
    ]);
  });

  it("passes through candles already at daily granularity unchanged", () => {
    const candles = [
      { time: day1, open: 10, high: 12, low: 9, close: 11 },
      { time: day2, open: 11, high: 13, low: 10, close: 12 }
    ];

    expect(bucketByDay(candles)).toEqual(candles);
  });

  it("returns an empty array for empty input", () => {
    expect(bucketByDay([])).toEqual([]);
  });
});
