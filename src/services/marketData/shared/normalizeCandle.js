/**
 * Build a candle in the app's canonical shape, coercing every field to a number.
 * Providers map their vendor-specific rows through this so the rest of the
 * pipeline (validation, chart) always sees `{ time(seconds), open, high, low, close }`.
 *
 * @param {Object} fields
 * @param {number|string} fields.time  - Unix timestamp in SECONDS.
 * @param {number|string} fields.open
 * @param {number|string} fields.high
 * @param {number|string} fields.low
 * @param {number|string} fields.close
 * @returns {{ time: number, open: number, high: number, low: number, close: number }}
 */
export const toCandle = ({ time, open, high, low, close }) => ({
  time: Number(time),
  open: Number(open),
  high: Number(high),
  low: Number(low),
  close: Number(close)
});
