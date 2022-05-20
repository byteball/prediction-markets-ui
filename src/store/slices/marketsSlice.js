import { createSlice } from '@reduxjs/toolkit';
import { loadMarkets } from 'store/thunks/loadMarkets';

export const marketsSlice = createSlice({
  name: 'markets',
  initialState: {
    data: [],
    status: 'nothing'
  },
  reducers: {
    saveCreationOrder: (state, action) => { },
    addMarketInList: (state, action) => { state.data.push(action.payload) },
  },
  extraReducers: {
    [loadMarkets.pending]: (state, action) => {
      state.status = 'loading';
    },
    [loadMarkets.fulfilled]: (state, action) => {
      state.data = action.payload;
      state.status = 'loaded';
    },
    [loadMarkets.rejected]: (state, action) => {
      state.status = 'error';
    },
  }
});

export const {
  addMarketInList
} = marketsSlice.actions;

export default marketsSlice.reducer;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`

export const selectAllMarkets = state => state.markets.data;
export const selectMarketsStatus = state => state.markets.status;