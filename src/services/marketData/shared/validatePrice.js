/**
 * Validate a current price. Accepts only a finite number greater than zero,
 * rejecting `null`/`undefined`/`NaN`/`0`/non-numeric strings so a bad value
 * lets the chain fall through to the next source.
 *
 * @param {unknown} price
 * @returns {number|null}
 */
export const validatePrice = (price) => {
  const n = Number(price);
  return Number.isFinite(n) && n > 0 ? n : null;
};
