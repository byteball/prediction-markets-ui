import { coingeckoProvider } from "./coingecko";
import { coinbaseProvider } from "./coinbase";
import { bitstampProvider } from "./bitstamp";
import { krakenProvider } from "./kraken";
import { bitfinexProvider } from "./bitfinex";
import { coinpaprikaProvider } from "./coinpaprika";
import type { Provider } from "../types";

// Provider registry. Array order = fallback priority; the orchestrator tries
// each in turn until one returns valid data. CoinGecko goes first by design.
// Add/remove a source by editing these lists only.

export const CANDLE_PROVIDERS: Provider[] = [
  coingeckoProvider,
  coinbaseProvider,
  bitstampProvider,
  krakenProvider,
  bitfinexProvider
];

export const PRICE_PROVIDERS: Provider[] = [
  coingeckoProvider,
  coinbaseProvider,
  bitstampProvider,
  krakenProvider,
  bitfinexProvider,
  coinpaprikaProvider
];
