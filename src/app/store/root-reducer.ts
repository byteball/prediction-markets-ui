import { combineReducers } from "@reduxjs/toolkit";

import type { RootState } from "@/shared/lib/redux";
import { localeReducer } from "@/shared/i18n/model";
import { searchCacheReducer } from "@/shared/api/market-data/model/search-cache-slice";
import { marketReducer, marketViewReducer } from "@/entities/market/model";
import { walletBalancesReducer, walletReducer } from "@/entities/wallet/model";
import { reserveAssetReducer } from "@/entities/reserve-asset/model";
import { bridgesReducer } from "@/entities/bridge/model";
import { creationOrderReducer } from "@/features/create-market/model";

export const rootReducer = combineReducers({
  locale: localeReducer,
  wallet: walletReducer,
  walletBalances: walletBalancesReducer,
  market: marketReducer,
  marketView: marketViewReducer,
  reserveAsset: reserveAssetReducer,
  bridges: bridgesReducer,
  creationOrder: creationOrderReducer,
  searchCache: searchCacheReducer,
});

// Every slice declares its key on RootState through module augmentation (see shared/lib/redux).
// This check fails to compile when a slice is declared but not combined here, or combined
// under a key that no slice declared.
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type _RootStateMatchesReducers = Equals<ReturnType<typeof rootReducer>, RootState>;
const _rootStateMatchesReducers: _RootStateMatchesReducers = true;
void _rootStateMatchesReducers;
