import { createAsyncThunk } from "@reduxjs/toolkit";

import backend from "services/backend";

export const loadCurrencyCalendarCache = createAsyncThunk(
  'loadCurrencyCalendarCache',
  async ({ page = 1, currency = "GBYTE" }) => {
    const { data, count } = await backend.getCurrencyCalendar(currency, page);

    return {
      data,
      count,
      currency
    }
  })