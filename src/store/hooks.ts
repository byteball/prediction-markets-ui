import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";

import type { AppDispatch, RootState } from "store";

// RootState/AppDispatch are derived from the store factory in src/store/index.ts
// (not from the instance in store/store.ts) so that slices and thunks can import
// them without a circular type dependency on the instance module.
export type { AppDispatch, RootState };

/** Third generic of `createAsyncThunk` so `thunkAPI.dispatch` accepts thunks and `getState()` is typed. */
export type AppThunkApiConfig = { state: RootState; dispatch: AppDispatch };

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
