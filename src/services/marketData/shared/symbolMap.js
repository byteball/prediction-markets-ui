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
