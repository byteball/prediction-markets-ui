import { createAsyncThunk } from "@reduxjs/toolkit";
import { isEqual } from "lodash";

import backend from "services/backend";
import { updateReserveDailyRate } from "./updateReserveDailyRate";
import { updateReserveHourlyRate } from "./updateReserveHourlyRate";

export const loadReserveAssets = createAsyncThunk(
  'loadReserveAssets',
  async (_, { dispatch, getState }) => {
    const assets = await backend.getReserveAssets();
    const state = getState();

    const reserveAssetsHaveBeenChanged = !isEqual(assets, state.settings.reserveAssets);

    dispatch(updateReserveHourlyRate({ assets, reserveAssetsHaveBeenChanged}));
    dispatch(updateReserveDailyRate({ assets, reserveAssetsHaveBeenChanged}));

    return assets;
  })