import { createAsyncThunk } from "@reduxjs/toolkit";

import client from "@/shared/api/obyte-client";
import type { AppThunkApiConfig } from "@/shared/lib/redux";
import { loadUserBalance, setWalletAddress } from "@/entities/wallet";

/** Connects a wallet: loads its balances, subscribes to its transactions and only then stores the address. */
export const changeWalletAddress = createAsyncThunk<string, string, AppThunkApiConfig>("changeWalletAddress", async (walletAddress, { dispatch }) => {
  dispatch(loadUserBalance(walletAddress));

  await client.justsaying("light/new_address_to_watch", walletAddress);

  dispatch(setWalletAddress(walletAddress));

  return walletAddress;
});
