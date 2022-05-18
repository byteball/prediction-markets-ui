import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import backend from "services/backend";

export const loadMarkets = createAsyncThunk(
  'loadMarkets',
  async () => {
    const markets = await backend.getMarkets();

    return markets;
  })