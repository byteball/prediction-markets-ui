import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { RootState } from "@/shared/lib/redux";

export interface WalletState {
  /** Obyte address the user connected to the site (persisted), null when none. */
  address: string | null;
}

const initialState: WalletState = { address: null };

export const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    setWalletAddress: (state, action: PayloadAction<string | null>) => {
      state.address = action.payload;
    },
  },
});

export const { setWalletAddress } = walletSlice.actions;

export const walletReducer = walletSlice.reducer;

export const selectWalletAddress = (state: RootState) => state.wallet.address;

declare module "@/shared/lib/redux" {
  interface RootState {
    wallet: WalletState;
  }
}
