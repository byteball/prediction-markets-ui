import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"

export const updateReserveRate = createAsyncThunk(
  'updateReserveRate',
  async (assets, { getState }) => {
    const state = getState();

    const tokensSymbol = Object.keys(state.settings.reserveAssets);
    // console.log('tokensSymbol', tokensSymbol)
    const rates = {};
    const rateGetters = tokensSymbol.map((symbol) => axios.get(`https://min-api.cryptocompare.com/data/v2/histohour?fsym=${symbol}&tsym=USD&limit=26`).then(({data}) => {
      const res = {};
      data.Data.Data.forEach((candle) => res[candle.time] = candle.close);
      rates[symbol] = res;
    }))


    await Promise.all(rateGetters);
    console.log('rateGetters', rates)
    // await axios.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${Object.keys(assets).join(",")}&tsyms=USD`).then(data => Object.keys(data.data).forEach((currency) => rates[assets[currency]] = data.data[currency]?.USD));
    return rates
  })