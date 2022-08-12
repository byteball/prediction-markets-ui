import { combineReducers, configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
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

import settingsSlice from './slices/settingsSlice';
import marketsSlice from './slices/marketsSlice';
import activeSlice from './slices/activeSlice';
import cacheSlice from './slices/cacheSlice';
import bridgesSlice from './slices/bridgesSlice';
import userWalletSlice from './slices/userWalletSlice';

import config from "appConfig";

const rootReducer = combineReducers({
  settings: settingsSlice,
  markets: marketsSlice,
  active: activeSlice,
  cache: cacheSlice,
  bridges: bridgesSlice,
  userWallet: userWalletSlice
});

const persistConfig = {
  key: `prediction${config.ENVIRONMENT === "testnet" ? "-tn" : ""}314`,
  version: 3,
  storage,
  whitelist: ['settings'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer);

const getStore = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    })
  });

  const persistor = persistStore(store);

  return { store, persistor };
}

export default getStore;

export const getPersist = (state) => state._persist;