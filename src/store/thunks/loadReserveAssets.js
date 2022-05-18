import { createAsyncThunk } from "@reduxjs/toolkit";
import backend from "services/backend";
import { updateReserveRate } from "./updateReserveRate";

export const loadReserveAssets = createAsyncThunk(
  'loadReserveAssets',
  async (_, { dispatch }) => {
    const assets = await backend.getReserveAssets();
    dispatch(updateReserveRate(assets));
    
    return assets;
  })