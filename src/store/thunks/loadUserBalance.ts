import { createAsyncThunk } from "@reduxjs/toolkit";

import client from "services/obyte";
import type { AppThunkApiConfig } from "store/hooks";
import type { WalletBalance } from "store/types";

export const loadUserBalance = createAsyncThunk<{ address: string; balance: WalletBalance | undefined }, string, AppThunkApiConfig>("loadUserBalance", async (walletAddress) => {
  const balance: WalletBalance | undefined = await client.api.getBalances([walletAddress]).then((b: Record<string, WalletBalance> | undefined) => b?.[walletAddress]);

  return {
    address: walletAddress,
    balance,
  };
});
