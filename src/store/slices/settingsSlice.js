import { createSlice } from '@reduxjs/toolkit';
import { loadCategories } from 'store/thunks/loadCategories';
import { loadReserveAssets } from 'store/thunks/loadReserveAssets';
import { updateReserveDailyRate } from 'store/thunks/updateReserveDailyRate';
import { updateReserveHourlyRate } from 'store/thunks/updateReserveHourlyRate';

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    creationOrder: null,
    walletAddress: null,
    categories: [],
    extraCategories: [],
    reserveHourlyRates: {},
    hourlyRateUpdateTime: 0,
    reserveDailyRates: {},
    dailyRateUpdateTime: 0,
    reserveAssets: {}
  },
  reducers: {
    saveCreationOrder: (state, action) => {
      state.creationOrder = {
        data: action.payload,
        status: 'order'
      };
    },
    addExtraCategory: (state, action) => {
      const value = action.payload;

      if (value && ![...state.categories, ...state.extraCategories].find((c) => c === value)) {
        state.extraCategories.push(value)
      }
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
    changeWalletAddress: (state, action) => {
      state.walletAddress = action.payload;
    }
  },
  extraReducers: {
    [loadCategories.fulfilled]: (state, action) => {
      state.categories = action.payload;
    },
    [loadReserveAssets.fulfilled]: (state, action) => {
      state.reserveAssets = action.payload;
    },
    [updateReserveHourlyRate.fulfilled]: (state, action) => {
      if (action.payload) {
        state.reserveHourlyRates = action.payload;
        state.hourlyRateUpdateTime = Math.floor(Date.now() / 1000);
      }
    },
    [updateReserveDailyRate.fulfilled]: (state, action) => {
      if (action.payload) {
        state.reserveDailyRates = action.payload;
        state.dailyRateUpdateTime = Math.floor(Date.now() / 1000);
      }
    }
  }
});

export const {
  saveCreationOrder,
  removeCreationOrder,
  updateCreationOrder,
  cancelRegSymbol,
  addExtraCategory,
  changeWalletAddress
} = settingsSlice.actions;

export default settingsSlice.reducer;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`

export const selectCreationOrder = state => state.settings.creationOrder;
export const selectReserveAssets = state => state.settings.reserveAssets;
export const selectCategories = state => state.settings.categories;
export const selectExtraCategories = state => state.settings.extraCategories;
export const selectReservesHourlyRate = state => state.settings.reserveHourlyRates;
export const selectReservesDailyUsdRate = state => state.settings.reserveDailyRates;
export const selectWalletAddress = state => state.settings.walletAddress;