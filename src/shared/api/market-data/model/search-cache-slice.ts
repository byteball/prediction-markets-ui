import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/shared/lib/redux";

export interface SearchCacheState {
  results: Record<string, Record<string, string>>;
}

export interface CacheSearchResultPayload {
  provider: string;
  symbol: string;
  key: string;
}

const initialState: SearchCacheState = {
  results: {} // { [provider]: { [symbol]: key } }
};

// Persisted cache of symbol -> id lookups resolved via providers' /search endpoints.
// Stored per provider so the same ticker can map to different ids (e.g. CoinGecko
// "bitcoin" vs Coinpaprika "btc-bitcoin"). Persisted to localStorage like settings,
// so a symbol is searched at most once across sessions.
const searchCacheSlice = createSlice({
  name: "searchCache",
  initialState,
  reducers: {
    // payload: { provider, symbol, key } — provider + resolved id (key) under the symbol
    cacheSearchResult: (state, action: PayloadAction<Partial<CacheSearchResultPayload> | undefined>) => {
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

export const selectSearchCache = (state: RootState) => state.searchCache.results;

export const searchCacheReducer = searchCacheSlice.reducer;

declare module "@/shared/lib/redux" {
  interface RootState {
    searchCache: SearchCacheState;
  }
}
