import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { RootState } from "@/shared/lib/redux";
import { selectWalletAddress } from "@/entities/wallet/@x/market";

import { addRecentEvent } from "./add-recent-event";
import { loadMoreRecentEvents } from "./load-more-recent-events";
import { setActiveMarket } from "./set-active-market";
import type { Candle, CurrencyCandle, MarketParams, MarketStateVars, OutcomeAmounts, OutcomeType, RecentEvent, Team } from "./types";

export type ActiveMarketStatus = "not selected" | "loading" | "loaded" | "error";

/** The market currently opened on the market page, with everything loaded for it. */
export interface MarketState {
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

const initialState: MarketState = {
  address: null,
  status: "not selected",
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

export const marketSlice = createSlice({
  name: "market",
  initialState,
  reducers: {
    setActiveMarketAddress: (state, action: PayloadAction<string>) => {
      state.address = action.payload;
      state.status = "loading";
    },
    updateStateForActualMarket: (state, action: PayloadAction<{ diff: Partial<MarketStateVars>; address: string }>) => {
      const { diff, address } = action.payload;

      if (state.address === address) {
        state.stateVars = { ...state.stateVars, ...diff };
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
    },
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

      state.status = "loaded";
    });

    builder.addCase(setActiveMarket.rejected, (state) => {
      state.status = "error";
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

        state.recentEvents = [...state.recentEvents, ...recentEvents];
        state.recentEventsCount = action.payload.recentEventsCount;
      }
    });
  },
});

export const { setActiveMarketAddress, updateStateForActualMarket, updateSymbolForActualMarket, updateDataFeedValue } = marketSlice.actions;

export const marketReducer = marketSlice.reducer;

export const selectActiveMarketStatus = (state: RootState) => state.market.status;
export const selectActiveMarketParams = (state: RootState): MarketParams => state.market.params || ({} as MarketParams);
export const selectActiveMarketStateVars = (state: RootState): MarketStateVars => state.market.stateVars || ({} as MarketStateVars);
export const selectActiveCategory = (state: RootState) => state.market.category || "No category";
export const selectActiveAddress = (state: RootState) => state.market.address;
export const selectActiveRecentEvents = (state: RootState) => state.market.recentEvents;
export const selectActiveRecentEventsCount = (state: RootState) => state.market.recentEventsCount;
export const selectActiveDailyCandles = (state: RootState) => state.market.dailyCandles;
export const selectActiveDatafeedValue = (state: RootState) => state.market.datafeedValue;
export const selectActiveTeams = (state: RootState) => state.market.teams;
export const selectActiveCurrencyCandles = (state: RootState) => state.market.currencyCandles;
export const selectActiveCurrencyCurrentValue = (state: RootState) => state.market.currencyCurrentValue;

const ZERO_BALANCES: OutcomeAmounts = { yes: 0, no: 0, draw: 0 };

/** The connected wallet's positions in a tokenless market (kept in the AA state); null for tokened markets. */
export const selectUserOutcomeBalances = createSelector(
  [(state: RootState) => state.market.stateVars, (state: RootState) => state.market.params.is_tokenless, selectWalletAddress],
  (stateVars, is_tokenless, walletAddress): OutcomeAmounts | null => {
    if (!walletAddress || !is_tokenless) return null;

    return stateVars[`balance_${walletAddress}`] ?? ZERO_BALANCES;
  }
);

declare module "@/shared/lib/redux" {
  interface RootState {
    market: MarketState;
  }
}
