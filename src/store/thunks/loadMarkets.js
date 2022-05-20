import { createAsyncThunk } from "@reduxjs/toolkit";

import backend from "services/backend";

export const loadMarkets = createAsyncThunk(
  'loadMarkets',
  async () => {
    return await backend.getMarkets();
  })