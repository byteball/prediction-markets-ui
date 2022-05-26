import { createAsyncThunk } from "@reduxjs/toolkit";
import moment from 'moment';

import client from "services/obyte";
import { updateDataFeedValue } from "store/slices/activeSlice";

export const checkDataFeed = createAsyncThunk(
  'checkDataFeed',
  async (_, { getState, dispatch }) => {
    const state = getState();
    const now = moment.utc().unix();

    if (state.active.address) {
      const { waiting_period_length, end_of_trading_period, oracle, feed_name } = state.active.params;

      if (!state.active.stateVars.result) {
        if (now > end_of_trading_period && now < end_of_trading_period + waiting_period_length) {
          const datafeedValue = await client.api.getDataFeed({ oracles: [oracle], feed_name: feed_name, ifnone: 'none' });

          if (datafeedValue !== 'none') {
            dispatch(updateDataFeedValue(datafeedValue));
          }
        }
      }
    }
  }
)