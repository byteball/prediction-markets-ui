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

import userWalletSlice from './slices/userWalletSlice';
import settingsSlice from './slices/settingsSlice';
import activeSlice from './slices/activeSlice';
import bridgesSlice from './slices/bridgesSlice';

import config from "appConfig";

const rootReducer = combineReducers({
  settings: settingsSlice,
  active: activeSlice,
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

export const getPersist = (state) => state._persist;