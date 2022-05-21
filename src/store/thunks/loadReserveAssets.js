import { createAsyncThunk } from "@reduxjs/toolkit";
import backend from "services/backend";
import { updateReserveDailyRate } from "./updateReserveDailyRate";
import { updateReserveRate } from "./updateReserveRate";

export const loadReserveAssets = createAsyncThunk(
  'loadReserveAssets',
  async (_, { dispatch }) => {
    const assets = await backend.getReserveAssets();
    // TODO: Check if the reserve has changed, if so, update the rates
    dispatch(updateReserveRate());
    dispatch(updateReserveDailyRate());

    return assets;
  })