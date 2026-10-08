import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from 'redux-persist';
import storage from "redux-persist/lib/storage";

import userWalletSlice from './slices/user-wallet-slice';
import settingsSlice from './slices/settings-slice';
import activeSlice from './slices/active-slice';
import bridgesSlice from './slices/bridges-slice';
import searchCacheSlice from './slices/search-cache-slice';

import config from "app-config";

const rootReducer = combineReducers({
  settings: settingsSlice,
  active: activeSlice,
  bridges: bridgesSlice,
  userWallet: userWalletSlice,
  searchCache: searchCacheSlice
});

const persistConfig = {
  key: `prediction${config.ENVIRONMENT === "testnet" ? "-tn" : ""}314`,
  version: 3,
  storage,
  whitelist: ['settings', 'searchCache'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer);

const getStore = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
        }
      })
  });

  const persistor = persistStore(store);

  return { store, persistor };
}

export default getStore;

export type AppStore = ReturnType<typeof getStore>["store"];
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
