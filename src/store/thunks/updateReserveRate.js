import { createAsyncThunk } from "@reduxjs/toolkit";
import { isEmpty } from "lodash";

import { getCurrencyPrice } from "services/marketData";
import { getBaseUsdRate } from "services/oswap";

export const updateReserveRate = createAsyncThunk(
  'updateReserveRate',
  async ({ assets, reserveAssetsHaveBeenChanged }, { getState }) => {
    const state = getState();

    if (isEmpty(state.settings.reserveRates) || reserveAssetsHaveBeenChanged || (state.settings.reserveRateUpdateTime + 1800 <= (Date.now() / 1000))) {
      const startTime = Date.now();
      const rates = {};

      const reserveAssets = assets || state.settings.reserveAssets;

      // every non-base reserve asset, priced in USD through the market-data fallback chain
      const pricedAssets = Object.entries(reserveAssets).filter(([asset]) => asset !== "base");

      console.log('[updateReserveRate] requesting base (oswap GBYTE_USD) + USD rates for:', pricedAssets.map(([, { symbol }]) => symbol));

      // reserve-asset USD rates (via providers chain) and the base (GBYTE) rate from oswap run in parallel
      const reserveRequests = pricedAssets.map(([asset, { symbol }]) =>
        getCurrencyPrice({ from: symbol, to: "USD" }).then((price) => {
          console.log(`[updateReserveRate] received ${symbol} in ${Date.now() - startTime}ms:`, price);
          if (price) rates[asset] = price;
        }).catch((error) => console.error(`[updateReserveRate] ${symbol} request failed:`, error)));

      // base (GBYTE) price comes exclusively from oswap's exchange-rates feed
      const baseRequest = getBaseUsdRate()
        .then((base) => {
          console.log(`[updateReserveRate] received base (oswap GBYTE_USD) in ${Date.now() - startTime}ms:`, base);
          if (base) rates.base = base;
        }).catch((error) => console.error('[updateReserveRate] base (oswap) request failed:', error));

      await Promise.all([...reserveRequests, baseRequest]);

      console.log(`[updateReserveRate] resolved rates in ${Date.now() - startTime}ms:`, rates);

      return rates;
    }
  })
