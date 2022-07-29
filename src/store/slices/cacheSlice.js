import { createSlice } from '@reduxjs/toolkit';
import { loadCurrencyCalendarCache } from 'store/thunks/loadCurrencyCalendarCache';
import { loadMarketsInCache } from 'store/thunks/loadMarketsInCache';
import { loadSportsCalendarCache } from 'store/thunks/loadSportsCalendarCache';

export const cacheSlice = createSlice({
  name: 'cache',
  initialState: {
    calendar: {}
  },
  reducers: {},
  extraReducers: {
    [loadSportsCalendarCache.fulfilled]: (state, action) => {
      const { sport, championship, data, count } = action.payload;

      if (!(sport in state.calendar)) state.calendar[sport] = {};

      if (!(championship in state.calendar[sport])) state.calendar[sport][championship] = {
        data: [],
        count: count
      };

      state.calendar[sport][championship].data.push(...data);
      state.calendar[sport][championship].count = count;
    },
    [loadMarketsInCache.fulfilled]: (state, action) => {
      const { type, championship, data, count } = action.payload;


      if (championship) {
        if (!(type in state)) state[type] = {};

        if (!(championship in state[type])) state[type][championship] = {
          data: [],
          count: count
        };

        state[type][championship].data.push(...data);
        state[type][championship].count = count;

      } else {
        if (!(type in state)) {
          state[type] = {
            data: [],
            count: count
          };
        }

        state[type].data.push(...data);
        state[type].count = count;
      }
    },

    [loadCurrencyCalendarCache.fulfilled]: (state, action) => {
      const { data, count, currency } = action.payload;

      if (!("currency" in state.calendar)) state.calendar.currency = {};


      if (!(currency in state.calendar.currency)) state.calendar.currency[currency] = {
        data: [],
        count: count
      };

      state.calendar.currency[currency].data.push(...data);
      state.calendar.currency[currency].count = count;
    }
  }
});

export default cacheSlice.reducer;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`

export const selectMarketsCache = state => state.cache;