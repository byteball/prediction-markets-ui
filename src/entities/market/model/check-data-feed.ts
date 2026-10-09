import { createAsyncThunk } from "@reduxjs/toolkit";
import moment from 'moment';

import client from "@/shared/api/obyte-client";
import { updateDataFeedValue } from "./market-slice";
import type { AppThunkApiConfig } from "@/shared/lib/redux";

export const checkDataFeed = createAsyncThunk<void, void, AppThunkApiConfig>(
  'checkDataFeed',
  async (_, { getState, dispatch }) => {
    const state = getState();
    const now = moment.utc().unix();

    if (state.market.address) {
      const { waiting_period_length, event_date, oracle, feed_name } = state.market.params;

      if (!state.market.stateVars.result) {
        if (now > event_date && now < event_date + waiting_period_length) {
          const datafeedValue = await client.api.getDataFeed({ oracles: [oracle], feed_name: feed_name, ifnone: 'none' }) as string | number;

          if (datafeedValue !== 'none') {
            dispatch(updateDataFeedValue(datafeedValue));
          }
        }
      }
    }
  }
)
