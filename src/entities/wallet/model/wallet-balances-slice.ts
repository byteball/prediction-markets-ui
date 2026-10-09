import { createSelector, createSlice } from "@reduxjs/toolkit";

import type { RootState } from "@/shared/lib/redux";

import { loadUserBalance } from "./load-user-balance";
import { selectWalletAddress } from "./wallet-slice";
import type { WalletBalance } from "./types";

export interface WalletBalancesState {
  /** Hub balances by wallet address; loaded for the connected wallet, not persisted. */
  byAddress: Record<string, WalletBalance | undefined>;
}

const initialState: WalletBalancesState = { byAddress: {} };

export const walletBalancesSlice = createSlice({
  name: "walletBalances",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(loadUserBalance.fulfilled, (state, action) => {
      const { address, balance } = action.payload;

      state.byAddress[address] = balance;
    });
  },
});

export const walletBalancesReducer = walletBalancesSlice.reducer;

const selectWalletsBalance = (state: RootState) => state.walletBalances.byAddress;

/** Balances of the connected wallet, undefined until loaded. */
export const selectWalletBalance = createSelector(selectWalletAddress, selectWalletsBalance, (address, balances) => (address ? balances[address] : undefined));

declare module "@/shared/lib/redux" {
  interface RootState {
    walletBalances: WalletBalancesState;
  }
}
