import { createSlice } from '@reduxjs/toolkit';
import { loadEVMTokens } from 'store/thunks/loadEVMTokens';

export const bridgesSlice = createSlice({
  name: 'bridges',
  initialState: {
    tokensByNetwork: {}
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(loadEVMTokens.fulfilled, (state, action) => {
      state.tokensByNetwork = action.payload;
    });
  }
});

export default bridgesSlice.reducer;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`

export const selectTokensByNetwork = state => state.bridges.tokensByNetwork;