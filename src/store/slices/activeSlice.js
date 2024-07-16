import { createSlice } from '@reduxjs/toolkit';
import { addRecentEvent } from 'store/thunks/addRecentEvent';
import { loadMoreRecentEvents } from 'store/thunks/loadMoreRecentEvents';
import { setActiveMarket } from 'store/thunks/setActiveMarket';

export const activeSlice = createSlice({
  name: 'active',
  initialState: {
    address: null,
    status: 'not selected', // selected, loaded
    stateVars: {},
    category: null,
    params: {},
    recentEvents: [],
    recentEventsCount: 0,
    dailyCandles: [],
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
  extraReducers: (builder) => {
    builder.addCase(setActiveMarket.fulfilled, (state, action) => {
      const { params, stateVars, recentEvents, recentEventsCount, dailyCandles, datafeedValue, yesTeam, noTeam, currencyCandles, currencyCurrentValue, league, created_at, committed_at, base_aa, first_trade_ts, yes_odds, no_odds, draw_odds, yes_crest_url, no_crest_url } = action.payload;

      state.params = { ...params, ...league, created_at, committed_at, first_trade_ts, base_aa, yes_odds, no_odds, draw_odds, yes_crest_url, no_crest_url };
      state.stateVars = stateVars;
      state.recentEvents = recentEvents;
      state.recentEventsCount = recentEventsCount;
      state.dailyCandles = dailyCandles;
      state.datafeedValue = datafeedValue;
      state.currencyCandles = currencyCandles || [];
      state.currencyCurrentValue = currencyCurrentValue || 0;
      state.teams = { yes: yesTeam || null, no: noTeam || null };

      state.status = 'loaded';
    });

    builder.addCase(setActiveMarket.rejected, (state, action) => {
      state.status = 'error';
    });

    builder.addCase(addRecentEvent.fulfilled, (state, action) => {
      if (action.payload) {
        state.recentEvents.push(action.payload);
        state.recentEventsCount = state.recentEventsCount + 1;
      }
    });

    builder.addCase(loadMoreRecentEvents.fulfilled, (state, action) => {
      if (action.payload) {
        const recentEvents = action.payload.recentEvents || [];

        state.recentEvents = [...state.recentEvents, ...recentEvents]
        state.recentEventsCount = action.payload.recentEventsCount;
      }
    })
  }
});

export const {
  setActiveMarketAddress,
  updateStateForActualMarket,
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
export const selectActiveRecentEvents = state => state.active.recentEvents;
export const selectActiveRecentEventsCount = state => state.active.recentEventsCount;
export const selectActiveDailyCandles = state => state.active.dailyCandles;
export const selectActiveDatafeedValue = state => state.active.datafeedValue;
export const selectActiveTeams = state => state.active.teams;
export const selectActiveCurrencyCandles = state => state.active.currencyCandles;
export const selectActiveCurrencyCurrentValue = state => state.active.currencyCurrentValue;