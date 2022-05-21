import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"

export const updateReserveDailyRate = createAsyncThunk(
  'updateReserveDailyRate',
  async ({ assets, reserveAssetsHaveBeenChanged }, { getState }) => {
    const state = getState();

    if (reserveAssetsHaveBeenChanged || (state.settings.dailyRateUpdateTime + 6 * 3600 <= Math.floor(Date.now() / 1000))) {
      const rates = {};

      const rateGetters = Object.entries(assets || state.settings.reserveAssets).map(([asset, { symbol }]) => axios.get(`https://min-api.cryptocompare.com/data/v2/histoday?fsym=${symbol}&tsym=USD&limit=168`).then(({ data }) => {
        const res = {};
        data.Data.Data.forEach((candle) => res[candle.time] = candle.close);
        rates[asset] = res;
      }))


      await Promise.all(rateGetters);

      return rates
    }

    return false
  })