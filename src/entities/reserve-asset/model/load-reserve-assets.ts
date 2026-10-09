import { createAsyncThunk } from "@reduxjs/toolkit";
import { isEqual } from "lodash-es";

import { getReserveAssets } from "../api/reserve-assets-api";
import type { AppThunkApiConfig } from "@/shared/lib/redux";

import { updateReserveRate } from "./update-reserve-rate";
import type { ReserveAssets } from "./types";

export const loadReserveAssets = createAsyncThunk<ReserveAssets, void, AppThunkApiConfig>("loadReserveAssets", async (_, { dispatch, getState }) => {
  const assets: ReserveAssets = await getReserveAssets();
  const state = getState();

  const reserveAssetsHaveBeenChanged = !isEqual(assets, state.reserveAsset.assets);

  dispatch(updateReserveRate({ assets, reserveAssetsHaveBeenChanged }));

  return assets;
});
