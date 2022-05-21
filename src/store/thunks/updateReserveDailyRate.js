import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"

export const updateReserveDailyRate = createAsyncThunk(
  'updateReserveDailyRate',
  async (_, { getState }) => {
    const state = getState();

    if (state.settings.reserveDailyRatesUpdateTime + 6 * 3600 <= Math.floor(Date.now() / 1000)) {
      const tokensSymbol = Object.keys(state.settings.reserveAssets);

      const rates = {};

      const rateGetters = tokensSymbol.map((symbol) => axios.get(`https://min-api.cryptocompare.com/data/v2/histoday?fsym=${symbol}&tsym=USD&limit=168`).then(({ data }) => {
        const res = {};
        data.Data.Data.forEach((candle) => res[candle.time] = candle.close);
        rates[symbol] = res;
      }))


      await Promise.all(rateGetters);

      return rates
    }
    
    return false
  })