import { createAsyncThunk } from "@reduxjs/toolkit";

import backend from "services/backend";

export const loadMarkets = createAsyncThunk(
  'loadMarkets',
  async () => {
    const { data: markets, max_count: marketsCount } = await backend.getAllMarkets();
    const championships = await backend.getChampionships();
    const { data: currencyMarkets, max_count: currencyMarketsCount } = await backend.getCurrencyMarkets();

    return {
      markets,
      marketsCount,
      currencyMarkets,
      currencyMarketsCount,
      championships
    }
  })