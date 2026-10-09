import { min } from "lodash-es";

/** Sparkline series of a market card: prices shifted so the lowest point is 0 (a single candle is doubled so a line renders). */
export const getSparklineData = (candles?: { price: number }[], previewValues?: number[]) => {
  const prices: number[] = previewValues ?? (candles ? (candles.length === 1 ? [...candles, ...candles] : candles) : []).map(({ price }) => price);
  const minValue = min(prices) ?? 0;

  return { dataForChart: prices.map((value) => value - minValue), minValue };
};
