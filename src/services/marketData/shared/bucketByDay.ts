import type { Candle } from "../types";

const DAY = 24 * 60 * 60;

/**
 * Aggregate candles into one candle per UTC day (open = first, close = last,
 * high = max, low = min). Needed for the daily chart view because some sources
 * (e.g. CoinGecko free OHLC) only return intraday — 4h — candles, which would
 * otherwise render as several candles under a single date label. A source already
 * at daily granularity passes through unchanged (one candle per bucket).
 *
 * Input must be sorted ascending by `time`; output stays ascending.
 */
export const bucketByDay = (candles: Candle[]): Candle[] => {
  const byDay = new Map<number, Candle>();

  for (const candle of candles) {
    const day = Math.floor(candle.time / DAY) * DAY;
    const bucket = byDay.get(day);

    if (!bucket) {
      byDay.set(day, { time: day, open: candle.open, high: candle.high, low: candle.low, close: candle.close });
    } else {
      bucket.high = Math.max(bucket.high, candle.high);
      bucket.low = Math.min(bucket.low, candle.low);
      bucket.close = candle.close; // candles are ascending, so the last write is the day's close
    }
  }

  return Array.from(byDay.values());
};
