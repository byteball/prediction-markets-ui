import { createAsyncThunk } from "@reduxjs/toolkit";

import backend from "services/backend";

export const loadMarketsInCache = createAsyncThunk(
  'loadMarketsInCache',
  async ({ type, page = 1, championship }, { getState }) => {
    const state = getState();

    const { data, count, max_count } = await backend.getMarketsByType({ type, page, championship: championship !== 'all' ? championship : undefined });

    let filteredData = [];
    let customCount = count;

    if (type === 'soccer') {
      const cacheMarketsByType = state.cache?.[type]?.[championship]?.data || [];
      const marketsAddresses = cacheMarketsByType.map(({ aa_address }) => aa_address);

      filteredData = data.filter(({ aa_address }) => !marketsAddresses.includes(aa_address));
      customCount = max_count;
    } else {
      const cacheMarketsByType = state.cache?.[type]?.data || [];

      let firstLoadedMarkets = [];

      if (type === 'all') {
        firstLoadedMarkets = state.markets.allMarkets || [];
      } else if (type === 'currency') {
        firstLoadedMarkets = state.markets.currencyMarkets || [];
      } else if (type === 'misc') {
        firstLoadedMarkets = state.markets.miscMarkets || [];
      } else {
        firstLoadedMarkets = [];
      }

      const unionMarketsAddresses = [...firstLoadedMarkets, ...cacheMarketsByType].map(({ aa_address }) => aa_address)

      filteredData = data.filter(({ aa_address }) => !unionMarketsAddresses.includes(aa_address));
    }

    return {
      type,
      championship,
      data: filteredData,
      count: customCount
    }
  })