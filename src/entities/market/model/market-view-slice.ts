import { createSlice } from "@reduxjs/toolkit";

import type { RootState } from "@/shared/lib/redux";

export type PriceOrOdds = "price" | "odds";

/** How outcome values are displayed across the app (persisted). */
export interface MarketViewState {
  priceOrOdds: PriceOrOdds;
}

const initialState: MarketViewState = { priceOrOdds: "odds" };

export const marketViewSlice = createSlice({
  name: "marketView",
  initialState,
  reducers: {
    changeViewType: (state) => {
      state.priceOrOdds = state.priceOrOdds === "odds" ? "price" : "odds";
    },
  },
});

export const { changeViewType } = marketViewSlice.actions;

export const marketViewReducer = marketViewSlice.reducer;

export const selectPriceOrOdds = (state: RootState): PriceOrOdds => state.marketView.priceOrOdds || "odds";

declare module "@/shared/lib/redux" {
  interface RootState {
    marketView: MarketViewState;
  }
}
