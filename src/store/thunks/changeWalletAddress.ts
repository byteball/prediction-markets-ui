import { createAsyncThunk } from "@reduxjs/toolkit";

import client from "services/obyte";
import { loadUserBalance } from "./loadUserBalance";
import type { AppThunkApiConfig } from "store/hooks";

export const changeWalletAddress = createAsyncThunk<string, string, AppThunkApiConfig>("changeWalletAddress", async (walletAddress, { dispatch }) => {
  dispatch(loadUserBalance(walletAddress));

  await client.justsaying("light/new_address_to_watch", walletAddress);

  return walletAddress;
});
