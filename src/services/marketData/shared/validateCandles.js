// Conservative validator/sanitizer for a candle array returned by a provider.
// Drops only clearly broken rows so a malformed/garbage response (broken JSON,
// HTML error page, wrong time units, swapped OHLC) is treated as a miss and the
// chain moves on to the next source. Thresholds are constants for easy tuning.

const MIN_CANDLES = 2;                 // need at least this many valid rows
const MIN_TIME = 1e9;                  // ~2001 in unix seconds; rejects garbage & ms-as-seconds-too-small
const MAX_TIME_SKEW = 24 * 60 * 60;    // allow up to 1 day into the future

/**
 * @param {unknown} candles - raw provider output (already mapped to candle shape)
 * @returns {{ candles: Array<{time:number,open:number,high:number,low:number,close:number}>, reason: string|null }}
 *   Cleaned, ascending, de-duplicated candles (possibly empty) and a rejection reason.
 */
export const validateCandles = (candles) => {
  if (!Array.isArray(candles) || candles.length === 0) {
    return { candles: [], reason: "not an array / empty" };
  }

  const maxTime = Math.floor(Date.now() / 1000) + MAX_TIME_SKEW;
  const seen = new Set();
  const cleaned = [];
  let bad = 0;

  for (const row of candles) {
    if (!row) { bad++; continue; }

    const time = Number(row.time);
    const open = Number(row.open);
    const high = Number(row.high);
    const low = Number(row.low);
    const close = Number(row.close);

    const ok =
      Number.isFinite(time) && time > MIN_TIME && time < maxTime &&
      [open, high, low, close].every((n) => Number.isFinite(n) && n > 0) &&
      high >= low &&
      high >= Math.max(open, close) &&
      low <= Math.min(open, close);

    if (!ok) { bad++; continue; }
    if (seen.has(time)) continue;

    seen.add(time);
    cleaned.push({ time, open, high, low, close });
  }

  cleaned.sort((a, b) => a.time - b.time);

  if (cleaned.length < MIN_CANDLES) {
    return { candles: [], reason: `kept ${cleaned.length} valid of ${candles.length} (bad: ${bad})` };
  }

  return { candles: cleaned, reason: bad ? `dropped ${bad} bad rows` : null };
};
