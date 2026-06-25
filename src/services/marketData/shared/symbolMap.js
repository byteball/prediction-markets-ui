// Exchange pair/asset helpers. CoinGecko and Coinpaprika ids are resolved
// dynamically via their public /search endpoints inside the respective providers,
// so no hand-maintained ticker->id tables live here.

// Kraken uses some non-standard asset codes (XBT for BTC, etc.), applied per side of the pair.
const krakenAssetOverrides = {
  BTC: "XBT",
  DOGE: "XDG"
};

/**
 * Translate a ticker symbol to Kraken's asset code.
 * @param {string} symbol
 * @returns {string}
 */
export const toKrakenAsset = (symbol) => krakenAssetOverrides[symbol] || symbol;

// Precious metals aren't crypto, but 1:1-pegged tokenized proxies trade on the same
// public exchanges, so the existing provider chain can fetch real OHLC/price for them.
const preciousMetalProxies = {
  XAU: "PAXG", // Pax Gold (~1 troy oz gold), well-supported (CoinGecko/Coinbase/Kraken)
  XAG: "KAG"   // Kinesis Silver (~1 troy oz silver) — best-effort, fewer venues
};

/**
 * Translate a precious-metal ticker (XAU/XAG) to its tokenized exchange proxy.
 * Non-metal symbols pass through unchanged.
 * @param {string} symbol
 * @returns {string}
 */
export const toPreciousMetalProxy = (symbol) => preciousMetalProxies[symbol?.toUpperCase()] || symbol;
