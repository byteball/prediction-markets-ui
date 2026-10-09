import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { RootState } from "@/shared/lib/redux";

import type { CreationOrder, CreationOrderData } from "./types";

export interface CreationOrderState {
  /** The market creation in progress (persisted so a reload does not lose it), null when none. */
  order: CreationOrder | null;
}

const initialState: CreationOrderState = { order: null };

export const creationOrderSlice = createSlice({
  name: "creationOrder",
  initialState,
  reducers: {
    saveCreationOrder: (state, action: PayloadAction<CreationOrderData>) => {
      state.order = { data: action.payload, status: "order" };
    },
    removeCreationOrder: (state) => {
      state.order = null;
    },
    updateCreationOrder: (state, action: PayloadAction<Partial<CreationOrder> | undefined>) => {
      state.order = { ...state.order, ...(action.payload || {}) } as CreationOrder;
    },
  },
});

export const { saveCreationOrder, removeCreationOrder, updateCreationOrder } = creationOrderSlice.actions;

export const creationOrderReducer = creationOrderSlice.reducer;

export const selectCreationOrder = (state: RootState) => state.creationOrder.order;

declare module "@/shared/lib/redux" {
  interface RootState {
    creationOrder: CreationOrderState;
  }
}
