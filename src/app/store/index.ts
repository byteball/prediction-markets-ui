import { configureStore } from "@reduxjs/toolkit";
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from "redux-persist";

import { cacheSearchResult, selectSearchCache } from "@/shared/api/market-data/model/search-cache-slice";
import { setIdCache } from "@/shared/api/market-data";

import { persistConfig } from "./persist";
import { rootReducer } from "./root-reducer";

// The single app-wide store instance, created once. Non-React modules that need it
// (bootstrap, the market-data id cache) import it from here.
export const store = configureStore({
  reducer: persistReducer(persistConfig, rootReducer),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type AppStore = typeof store;

// Persist the market-data providers' symbol -> id lookups in the store (and localStorage through it).
setIdCache({
  get: (provider, symbol) => selectSearchCache(store.getState())?.[provider]?.[symbol],
  set: (provider, symbol, key) => {
    store.dispatch(cacheSearchResult({ provider, symbol, key }));
  },
});
