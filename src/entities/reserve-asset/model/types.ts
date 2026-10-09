/** Assets markets may use as reserve, by asset id ("base" for bytes). */
export type ReserveAssets = Record<string, { symbol: string; decimals: number }>;

/** USD price of each reserve asset, by asset id. */
export type ReserveRates = Record<string, number>;
