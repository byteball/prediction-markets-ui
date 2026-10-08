import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";

import type { AppDispatch, RootState } from "@/store";

export type { AppDispatch, RootState };

export type AppThunkApiConfig = { state: RootState; dispatch: AppDispatch };

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
