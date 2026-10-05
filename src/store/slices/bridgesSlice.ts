import { createSlice } from '@reduxjs/toolkit';
import { loadEVMTokens } from 'store/thunks/loadEVMTokens';
import type { RootState } from 'store';
import type { Bridge } from 'store/types';

export interface BridgesState {
  tokensByNetwork: Record<string, Bridge[]>;
}

const initialState: BridgesState = {
  tokensByNetwork: {}
};

export const bridgesSlice = createSlice({
  name: 'bridges',
  initialState,
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

export const selectTokensByNetwork = (state: RootState) => state.bridges.tokensByNetwork;
