import { createAsyncThunk } from "@reduxjs/toolkit";
import { isEqual } from "lodash-es";

import backend from "services/backend";
import { updateReserveRate } from "./updateReserveRate";
import type { AppThunkApiConfig } from "store/hooks";
import type { ReserveAssets } from "store/types";

export const loadReserveAssets = createAsyncThunk<ReserveAssets, void, AppThunkApiConfig>(
  'loadReserveAssets',
  async (_, { dispatch, getState }) => {
    const assets: ReserveAssets = await backend.getReserveAssets();
    const state = getState();

    const reserveAssetsHaveBeenChanged = !isEqual(assets, state.settings.reserveAssets);

    dispatch(updateReserveRate({ assets, reserveAssetsHaveBeenChanged }));

    return assets;
  })
