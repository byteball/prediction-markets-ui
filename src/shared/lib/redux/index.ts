import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";

/**
 * Shape of the whole Redux state.
 *
 * It is empty here on purpose: every slice that owns a reducer adds its own key through
 * module augmentation, so no layer has to import the store assembly from `app`:
 *
 *   declare module "@/shared/lib/redux" {
 *     interface RootState { market: MarketState }
 *   }
 *
 * `app/store` combines the reducers and checks at compile time that the combined state
 * matches this interface.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RootState {}

export type AppDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;

export type AppThunkApiConfig = { state: RootState; dispatch: AppDispatch };

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
