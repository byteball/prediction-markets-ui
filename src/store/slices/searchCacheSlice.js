import { createSlice } from "@reduxjs/toolkit";

// Persisted cache of symbol -> id lookups resolved via providers' /search endpoints.
// Stored per provider so the same ticker can map to different ids (e.g. CoinGecko
// "bitcoin" vs Coinpaprika "btc-bitcoin"). Persisted to localStorage like settings,
// so a symbol is searched at most once across sessions.
const searchCacheSlice = createSlice({
  name: "searchCache",
  initialState: {
    results: {} // { [provider]: { [symbol]: key } }
  },
  reducers: {
    // payload: { provider, symbol, key } — provider + resolved id (key) under the symbol
    cacheSearchResult: (state, action) => {
      const { provider, symbol, key } = action.payload || {};
      if (!provider || !symbol || !key) return;
      if (!state.results[provider]) state.results[provider] = {};
      state.results[provider][symbol] = key;
    },
    clearSearchCache: (state) => {
      state.results = {};
    }
  }
});

export const { cacheSearchResult, clearSearchCache } = searchCacheSlice.actions;

export const selectSearchCache = (state) => state.searchCache.results;

export default searchCacheSlice.reducer;
