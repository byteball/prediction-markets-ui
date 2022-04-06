import { createSlice } from '@reduxjs/toolkit';

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    
  },
  reducers: {}
});

export const {} = settingsSlice.actions;

export default settingsSlice.reducer;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`

export const selectSettings = state => state.settings;