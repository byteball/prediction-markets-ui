import { createSelector, createSlice } from '@reduxjs/toolkit';
import { uniq } from 'lodash';
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
    popularCurrencyPairsByOracle: [],
    status: 'nothing'
  },
  reducers: {
    addMarketInList: (state, action) => { state.data.push(action.payload) },
  },
  extraReducers: (builder) => {
    builder.addCase(loadMarkets.pending, (state) => {
      state.status = 'loading';
    });

    builder.addCase(loadMarkets.fulfilled, (state, action) => {
      const { markets, currencyMarkets, championships, marketsCount, currencyMarketsCount, miscMarkets, miscMarketsCount, popularCurrencyPairsByOracle } = action.payload;

      state.allMarkets = markets;
      state.allMarketsCount = marketsCount;
      state.currencyMarkets = currencyMarkets;
      state.currencyMarketsCount = currencyMarketsCount;
      state.championships = championships;
      state.popularCurrencyPairsByOracle = popularCurrencyPairsByOracle;
      state.miscMarkets = miscMarkets;
      state.miscMarketsCount = miscMarketsCount;
      state.status = 'loaded';
    });

    builder.addCase(loadMarkets.rejected, (state) => {
      state.status = 'error';
    });
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

export const selectPopularCurrencyPairsByOracle = state => state.markets.popularCurrencyPairsByOracle;

export const selectPopularCurrencyPairs = createSelector(
  selectPopularCurrencyPairsByOracle,
  (pairsByOracle) => {
    const pairs = [];
    Object.keys(pairsByOracle).forEach((oracle) => {
      pairsByOracle[oracle].forEach((feed_name) => {
        pairs.push(feed_name);
      })
    })

    return pairs;
  });


export const selectPopularCurrencies = createSelector(
  selectPopularCurrencyPairs,
  (pairs) => uniq(pairs.map((feed_name) => feed_name.split("_")?.[0])));

export const selectAllMarketsCount = state => state.markets.allMarketsCount;
export const selectAllMarketsStatus = state => state.markets.status;