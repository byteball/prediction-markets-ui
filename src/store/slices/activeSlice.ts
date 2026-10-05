import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { addRecentEvent } from 'store/thunks/addRecentEvent';
import { loadMoreRecentEvents } from 'store/thunks/loadMoreRecentEvents';
import { setActiveMarket } from 'store/thunks/setActiveMarket';
import type { RootState } from 'store';
import type { Candle, CurrencyCandle, MarketParams, MarketStateVars, OutcomeType, RecentEvent, Team } from 'store/types';

export type ActiveMarketStatus = 'not selected' | 'loading' | 'loaded' | 'error';

export interface ActiveState {
  address: string | null;
  status: ActiveMarketStatus;
  stateVars: MarketStateVars;
  category: string | null;
  params: MarketParams;
  recentEvents: RecentEvent[];
  recentEventsCount: number;
  dailyCandles: Candle[];
  datafeedValue: string | number | null;
  currencyCandles: CurrencyCandle[];
  currencyCurrentValue: number;
  teams: { yes: Team | null; no: Team | null };
}

const initialState: ActiveState = {
  address: null,
  status: 'not selected', // selected, loaded
  stateVars: {} as MarketStateVars,
  category: null,
  params: {} as MarketParams,
  recentEvents: [],
  recentEventsCount: 0,
  dailyCandles: [],
  datafeedValue: null,
  currencyCandles: [],
  currencyCurrentValue: 0,
  teams: { yes: null, no: null },
};

export const activeSlice = createSlice({
  name: 'active',
  initialState,
  reducers: {
    setActiveMarketAddress: (state, action: PayloadAction<string>) => {
      state.address = action.payload;
      state.status = 'loading';
    },
    updateStateForActualMarket: (state, action: PayloadAction<{ diff: Partial<MarketStateVars>; address: string }>) => {
      const { diff, address } = action.payload;

      if (state.address === address) {
        state.stateVars = { ...state.stateVars, ...diff }
      }
    },
    updateSymbolForActualMarket: (state, action: PayloadAction<{ type?: OutcomeType; symbol?: string } | undefined>) => {
      const { type, symbol } = action.payload || {};

      if (type && symbol) {
        state.params[`${type}_symbol`] = symbol;
      }
    },
    updateDataFeedValue: (state, action: PayloadAction<string | number | null>) => {
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

    builder.addCase(setActiveMarket.rejected, (state) => {
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

export const selectActiveMarketStatus = (state: RootState) => state.active.status;
export const selectActiveMarketParams = (state: RootState): MarketParams => state.active.params || ({} as MarketParams);
export const selectActiveMarketStateVars = (state: RootState): MarketStateVars => state.active.stateVars || ({} as MarketStateVars);
export const selectActiveCategory = (state: RootState) => state.active.category || 'No category';
export const selectActiveAddress = (state: RootState) => state.active.address;
export const selectActiveRecentEvents = (state: RootState) => state.active.recentEvents;
export const selectActiveRecentEventsCount = (state: RootState) => state.active.recentEventsCount;
export const selectActiveDailyCandles = (state: RootState) => state.active.dailyCandles;
export const selectActiveDatafeedValue = (state: RootState) => state.active.datafeedValue;
export const selectActiveTeams = (state: RootState) => state.active.teams;
export const selectActiveCurrencyCandles = (state: RootState) => state.active.currencyCandles;
export const selectActiveCurrencyCurrentValue = (state: RootState) => state.active.currencyCurrentValue;
