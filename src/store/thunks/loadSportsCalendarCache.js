import { createAsyncThunk } from "@reduxjs/toolkit";

import backend from "services/backend";

export const loadSportsCalendarCache = createAsyncThunk(
  'loadSportsCalendarCache',
  async ({ sport, championship, page = 1 }) => {
    const { data, count } = await backend.getSportsCalendar(sport, championship, page);

    return {
      sport,
      championship,
      data,
      count
    }
  })