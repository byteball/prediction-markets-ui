import { createAsyncThunk } from "@reduxjs/toolkit";

import backend from "services/backend";

export const loadMarketsInCache = createAsyncThunk(
  'loadMarketsInCache',
  async ({ type, page = 1, championship }) => {
    const { data, count } = await backend.getMarketsByType({ type, page, championship: championship !== 'all' ? championship : undefined });

    return {
      type,
      championship,
      data,
      count
    }
  })