import { createSlice } from '@reduxjs/toolkit';
import { changeWalletAddress } from 'store/thunks/changeWalletAddress';
import { loadReserveAssets } from 'store/thunks/loadReserveAssets';
import { updateReserveRate } from 'store/thunks/updateReserveRate';

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
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
  },
  reducers: {
    saveCreationOrder: (state, action) => {
      state.creationOrder = {
        data: action.payload,
        status: 'order'
      };
    },
    removeCreationOrder: (state) => {
      state.creationOrder = null;
    },
    updateCreationOrder: (state, action) => {
      const payload = action.payload || {};

      state.creationOrder = {
        ...state.creationOrder,
        ...payload
      };
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
    changeLanguage: (state, action) => {
      state.lang = action.payload;
    },
    saveBaseOHLC: (state, action) => {
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

export const selectCreationOrder = state => state.settings.creationOrder;
export const selectReserveAssets = state => state.settings.reserveAssets;
export const selectReservesRate = state => state.settings.reserveRates;
export const selectWalletAddress = state => state.settings.walletAddress;
export const selectLanguage = state => state.settings.lang;
export const selectPriceOrOdds = state => state.settings.priceOrOdds || "odds";