import { createAsyncThunk } from "@reduxjs/toolkit";
import { uniqBy } from "lodash-es";

import backend from "services/backend";
import type { AppThunkApiConfig } from "store/hooks";
import type { RecentEvent } from "store/types";

type Args = { address: string | null; page: number };

type Result = { recentEvents: RecentEvent[]; recentEventsCount: number } | undefined;

export const loadMoreRecentEvents = createAsyncThunk<Result, Args, AppThunkApiConfig>("loadMoreRecentEvents", async ({ address, page }, { getState }) => {
  const state = getState();
  if (address === state.active.address) {
    const { data: recentEvents, count: recentEventsCount } = await backend.getRecentEvents(address as string, page);
    const uniqRecentEvents = uniqBy(recentEvents, "trigger_unit");

    return {
      recentEvents: uniqRecentEvents,
      recentEventsCount,
    };
  }
  return undefined;
});
