import { createAsyncThunk } from "@reduxjs/toolkit";
import { isEqual } from "lodash";

import backend from "services/backend";
import { updateReserveRate } from "./updateReserveRate";

export const loadReserveAssets = createAsyncThunk(
  'loadReserveAssets',
  async (_, { dispatch, getState }) => {
    const assets = await backend.getReserveAssets();
    const state = getState();

    const reserveAssetsHaveBeenChanged = !isEqual(assets, state.settings.reserveAssets);

    dispatch(updateReserveRate({ assets, reserveAssetsHaveBeenChanged }));

    return assets;
  })