import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { Candle as CurrencyCandle } from "@/shared/api/market-data";
import type { RootState } from "@/shared/lib/redux";

import { loadReserveAssets } from "./load-reserve-assets";
import { updateReserveRate } from "./update-reserve-rate";
import type { ReserveAssets, ReserveRates } from "./types";

const BASE_OHLC_TTL_SECONDS = 60 * 20;

export interface ReserveAssetState {
  assets: ReserveAssets;
  rates: ReserveRates;
  /** Unix seconds of the last successful rates refresh. */
  rateUpdateTime: number;
  /** Cached GBYTE candles shared by the live GBYTE markets, with an expiry. */
  baseOHLC: { data: CurrencyCandle[]; expireTs: number };
}

const initialState: ReserveAssetState = {
  assets: {},
  rates: {},
  rateUpdateTime: 0,
  baseOHLC: { data: [], expireTs: 0 },
};

export const reserveAssetSlice = createSlice({
  name: "reserveAsset",
  initialState,
  reducers: {
    saveBaseOHLC: (state, action: PayloadAction<CurrencyCandle[]>) => {
      state.baseOHLC = {
        data: action.payload,
        expireTs: Math.floor(Date.now() / 1000) + BASE_OHLC_TTL_SECONDS,
      };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadReserveAssets.fulfilled, (state, action) => {
      if (action.payload) {
        state.assets = action.payload;
      }
    });

    builder.addCase(updateReserveRate.fulfilled, (state, action) => {
      if (action.payload) {
        state.rates = action.payload;
        state.rateUpdateTime = Math.floor(Date.now() / 1000);
      }
    });
  },
});

export const { saveBaseOHLC } = reserveAssetSlice.actions;

export const reserveAssetReducer = reserveAssetSlice.reducer;

export const selectReserveAssets = (state: RootState) => state.reserveAsset.assets;
export const selectReservesRate = (state: RootState) => state.reserveAsset.rates;
export const selectReserveRateUpdateTime = (state: RootState) => state.reserveAsset.rateUpdateTime;
export const selectBaseOHLC = (state: RootState) => state.reserveAsset.baseOHLC;

declare module "@/shared/lib/redux" {
  interface RootState {
    reserveAsset: ReserveAssetState;
  }
}
