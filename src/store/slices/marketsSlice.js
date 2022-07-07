import { createSlice } from '@reduxjs/toolkit';
import { loadMarkets } from 'store/thunks/loadMarkets';

export const marketsSlice = createSlice({
  name: 'markets',
  initialState: {
    allMarkets: [],
    allMarketsCount: 0,
    currencyMarkets: [],
    currencyMarketsCount: 0,
    miscMarkets: [],
    miscMarketsCount: 0,
    championships: [],
    status: 'nothing'
  },
  reducers: {
    addMarketInList: (state, action) => { state.data.push(action.payload) },
  },
  extraReducers: {
    [loadMarkets.pending]: (state, action) => {
      state.status = 'loading';
    },
    [loadMarkets.fulfilled]: (state, action) => {
      const { markets, currencyMarkets, championships, marketsCount, currencyMarketsCount, miscMarkets, miscMarketsCount } = action.payload;

      state.allMarkets = markets;
      state.allMarketsCount = marketsCount;
      state.currencyMarkets = currencyMarkets;
      state.currencyMarketsCount = currencyMarketsCount;
      state.championships = championships;
      state.miscMarkets = miscMarkets;
      state.miscMarketsCount = miscMarketsCount;
      state.status = 'loaded';
    },
    [loadMarkets.rejected]: (state, action) => {
      state.status = 'error';
    },
  }
});

export const {
  addMarketInList
} = marketsSlice.actions;

export default marketsSlice.reducer;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`

export const selectAllMarkets = state => state.markets.allMarkets;
export const selectCurrencyMarkets = state => state.markets.currencyMarkets;
export const selectCurrencyMarketsCount = state => state.markets.currencyMarketsCount;

export const selectMiscMarkets = state => state.markets.miscMarkets;
export const selectMiscMarketsCount = state => state.markets.miscMarketsCount;

export const selectChampionships = state => state.markets.championships;
export const selectAllMarketsCount = state => state.markets.allMarketsCount;
export const selectAllMarketsStatus = state => state.markets.status;