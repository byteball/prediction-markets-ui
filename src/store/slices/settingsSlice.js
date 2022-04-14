import { createSlice } from '@reduxjs/toolkit';

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    creationOrder: null
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
  }
});

export const {
  saveCreationOrder,
  removeCreationOrder,
  updateCreationOrder
} = settingsSlice.actions;

export default settingsSlice.reducer;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`

export const selectCreationOrder = state => state.settings.creationOrder;