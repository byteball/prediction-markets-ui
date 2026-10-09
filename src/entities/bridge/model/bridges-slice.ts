import { createSlice } from "@reduxjs/toolkit";

import type { RootState } from "@/shared/lib/redux";

import { loadEVMTokens } from "./load-evm-tokens";
import type { Bridge } from "./types";

export interface BridgesState {
  /** Bridges whose foreign side is Obyte, grouped by the EVM network they come from. */
  tokensByNetwork: Record<string, Bridge[]>;
}

const initialState: BridgesState = { tokensByNetwork: {} };

export const bridgesSlice = createSlice({
  name: "bridges",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(loadEVMTokens.fulfilled, (state, action) => {
      state.tokensByNetwork = action.payload;
    });
  },
});

export const bridgesReducer = bridgesSlice.reducer;

export const selectTokensByNetwork = (state: RootState) => state.bridges.tokensByNetwork;

declare module "@/shared/lib/redux" {
  interface RootState {
    bridges: BridgesState;
  }
}
