import { createAsyncThunk } from "@reduxjs/toolkit";

import client from "@/shared/api/obyte-client";
import type { AppThunkApiConfig } from "@/shared/lib/redux";

import type { WalletBalance } from "./types";

export const loadUserBalance = createAsyncThunk<{ address: string; balance: WalletBalance | undefined }, string, AppThunkApiConfig>("loadUserBalance", async (walletAddress) => {
  const balance: WalletBalance | undefined = await client.api.getBalances([walletAddress]).then((b: Record<string, WalletBalance> | undefined) => b?.[walletAddress]);

  return {
    address: walletAddress,
    balance,
  };
});
