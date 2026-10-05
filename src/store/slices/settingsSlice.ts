import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { changeWalletAddress } from 'store/thunks/changeWalletAddress';
import { loadReserveAssets } from 'store/thunks/loadReserveAssets';
import { updateReserveRate } from 'store/thunks/updateReserveRate';
import type { RootState } from 'store';
import type { CreationOrder, CreationOrderData, CurrencyCandle, ReserveAssets, ReserveRates } from 'store/types';

export type PriceOrOdds = 'price' | 'odds';

export interface SettingsState {
  creationOrder: CreationOrder | null;
  cancelRegSymbol: boolean;
  walletAddress: string | null;
  reserveRates: ReserveRates;
  reserveRateUpdateTime: number;
  reserveAssets: ReserveAssets;
  sportsCalendar: unknown[];
  priceOrOdds: PriceOrOdds;
  baseOHLC: {
    data: CurrencyCandle[];
    expireTs: number;
  };
  lang: string | null;
}

const initialState: SettingsState = {
  creationOrder: null,
  cancelRegSymbol: false,
  walletAddress: null,
  reserveRates: {},
  reserveRateUpdateTime: 0,
  reserveAssets: {},
  sportsCalendar: [],
  priceOrOdds: 'odds',
  baseOHLC: {
    data: [],
    expireTs: 0
  },
  lang: null
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    saveCreationOrder: (state, action: PayloadAction<CreationOrderData>) => {
      state.creationOrder = {
        data: action.payload,
        status: 'order'
      };
    },
    removeCreationOrder: (state) => {
      state.creationOrder = null;
    },
    updateCreationOrder: (state, action: PayloadAction<Partial<CreationOrder> | undefined>) => {
      const payload = action.payload || {};

      state.creationOrder = {
        ...state.creationOrder,
        ...payload
      } as CreationOrder;
    },
    cancelRegSymbol: (state) => {
      if (state.creationOrder) {
        state.creationOrder.cancelRegSymbol = true;
      }
    },
    changeViewType: (state) => {
      if (state.priceOrOdds === 'odds') {
        state.priceOrOdds = 'price';
      } else {
        state.priceOrOdds = 'odds';
      }
    },
    changeLanguage: (state, action: PayloadAction<string>) => {
      state.lang = action.payload;
    },
    saveBaseOHLC: (state, action: PayloadAction<CurrencyCandle[]>) => {
      state.baseOHLC = {
        data: action.payload,
        expireTs: Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes
      };
    }
  },
  extraReducers: (builder) => {
    builder.addCase(loadReserveAssets.fulfilled, (state, action) => {
      if (action.payload) {
        state.reserveAssets = action.payload;
      }
    });

    builder.addCase(updateReserveRate.fulfilled, (state, action) => {
      if (action.payload) {
        state.reserveRates = action.payload;
        state.reserveRateUpdateTime = Math.floor(Date.now() / 1000);
      }
    });

    builder.addCase(changeWalletAddress.fulfilled, (state, action) => {
      state.walletAddress = action.payload;
    });
  }
});

export const {
  saveCreationOrder,
  removeCreationOrder,
  updateCreationOrder,
  cancelRegSymbol,
  changeViewType,
  changeLanguage,
  saveBaseOHLC
} = settingsSlice.actions;

export default settingsSlice.reducer;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`

export const selectCreationOrder = (state: RootState) => state.settings.creationOrder;
export const selectReserveAssets = (state: RootState) => state.settings.reserveAssets;
export const selectReservesRate = (state: RootState) => state.settings.reserveRates;
export const selectWalletAddress = (state: RootState) => state.settings.walletAddress;
export const selectLanguage = (state: RootState) => state.settings.lang;
export const selectPriceOrOdds = (state: RootState): PriceOrOdds => state.settings.priceOrOdds || "odds";
