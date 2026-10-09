import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { RootState } from "@/shared/lib/redux";

export interface LocaleState {
  /** Interface language code, null until detected from the URL or the browser. */
  lang: string | null;
}

const initialState: LocaleState = { lang: null };

export const localeSlice = createSlice({
  name: "locale",
  initialState,
  reducers: {
    changeLanguage: (state, action: PayloadAction<string>) => {
      state.lang = action.payload;
    },
  },
});

export const { changeLanguage } = localeSlice.actions;

export const localeReducer = localeSlice.reducer;

export const selectLanguage = (state: RootState) => state.locale.lang;

declare module "@/shared/lib/redux" {
  interface RootState {
    locale: LocaleState;
  }
}
