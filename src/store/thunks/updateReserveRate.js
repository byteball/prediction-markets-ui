import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"

export const updateReserveRate = createAsyncThunk(
  'updateReserveRate',
  async ({ assets, reserveAssetsHaveBeenChanged }, { getState }) => {
    const state = getState();

    if (reserveAssetsHaveBeenChanged || (state.settings.rateUpdateTime + 1800 <= Math.floor(Date.now() / 1000))) {
      const rates = {};

      await axios.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${Object.values(assets || state.settings.reserveAssets).map(({ symbol }) => symbol).join(',')}&tsyms=USD`).then(({ data }) => Object.entries(data).forEach(([symbol, { USD }]) => {
        const asset = Object.entries(assets).find(([_, item]) => item.symbol === symbol)[0];
        rates[asset] = USD;
      }));

      return rates
    }
  })