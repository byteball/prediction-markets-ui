import type { Candle } from "../types";

export type CandleInput = Record<keyof Candle, number | string>;

/**
 * Build a candle in the app's canonical shape, coercing every field to a number.
 * Providers map their vendor-specific rows through this so the rest of the
 * pipeline (validation, chart) always sees `{ time(seconds), open, high, low, close }`.
 */
export const toCandle = ({ time, open, high, low, close }: CandleInput): Candle => ({
  time: Number(time),
  open: Number(open),
  high: Number(high),
  low: Number(low),
  close: Number(close)
});
