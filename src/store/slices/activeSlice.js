import { createSlice } from '@reduxjs/toolkit';
import { setActiveMarket } from 'store/thunks/setActiveMarket';

export const activeSlice = createSlice({
  name: 'active',
  initialState: {
    address: null,
    status: 'not selected', // selected, loaded
    stateVars: {},
    category: null,
    params: {},
    recentResponses: [],
    dailyCloses: [],
    datafeedValue: null,
    currencyCandles: [],
    currencyCurrentValue: 0,
    teams: { yes: null, no: null },
  },
  reducers: {
    setActiveMarketAddress: (state, action) => {
      state.address = action.payload;
      state.status = 'loading';
    },
    updateStateForActualMarket: (state, action) => {
      const { diff, address } = action.payload;

      if (state.address === address) {
        state.stateVars = { ...state.stateVars, ...diff }
      }
    },
    addRecentResponse: (state, action) => {
      state.recentResponses.push(action.payload);
    },
    updateSymbolForActualMarket: (state, action) => {
      const { type, symbol } = action.payload || {};

      if (type && symbol) {
        state.params[`${type}_symbol`] = symbol;
      }
    },
    updateDataFeedValue: (state, action) => {
      state.datafeedValue = action.payload;
    }
  },
  extraReducers: {
    [setActiveMarket.fulfilled]: (state, action) => {
      const { params, stateVars, recentResponses, dailyCloses, datafeedValue, yesTeam, noTeam, currencyCandles, currencyCurrentValue, league, created_at } = action.payload;

      state.params = {...params, ...league, created_at };
      state.stateVars = stateVars;
      state.recentResponses = recentResponses;
      state.dailyCloses = dailyCloses;
      state.datafeedValue = datafeedValue;
      state.currencyCandles = currencyCandles || [];
      state.currencyCurrentValue = currencyCurrentValue || 0;
      state.teams = { yes: yesTeam || null, no: noTeam || null };

      state.status = 'loaded';
    },
    [setActiveMarket.rejected]: (state, action) => {
      state.status = 'error';
    },
  }
});

export const {
  setActiveMarketAddress,
  updateStateForActualMarket,
  addRecentResponse,
  updateSymbolForActualMarket,
  updateDataFeedValue
} = activeSlice.actions;

export default activeSlice.reducer;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`

export const selectActiveMarketStatus = state => state.active.status;
export const selectActiveMarketParams = state => state.active.params || {};
export const selectActiveMarketStateVars = state => state.active.stateVars || {};
export const selectActiveCategory = state => state.active.category || 'No category';
export const selectActiveAddress = state => state.active.address;
export const selectActiveRecentResponses = state => state.active.recentResponses;
export const selectActiveDailyCloses = state => state.active.dailyCloses;
export const selectActiveDatafeedValue = state => state.active.datafeedValue;
export const selectActiveTeams = state => state.active.teams;
export const selectActiveCurrencyCandles = state => state.active.currencyCandles;
export const selectActiveCurrencyCurrentValue = state => state.active.currencyCurrentValue;