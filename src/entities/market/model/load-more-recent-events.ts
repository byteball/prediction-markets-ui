import { createAsyncThunk } from "@reduxjs/toolkit";
import { uniqBy } from "lodash-es";

import { getRecentEvents } from "../api/market-api";
import type { AppThunkApiConfig } from "@/shared/lib/redux";

import type { RecentEvent } from "./types";

type Args = { address: string | null; page: number };

type Result = { recentEvents: RecentEvent[]; recentEventsCount: number } | undefined;

export const loadMoreRecentEvents = createAsyncThunk<Result, Args, AppThunkApiConfig>("loadMoreRecentEvents", async ({ address, page }, { getState }) => {
  const state = getState();
  if (address === state.market.address) {
    const { data: recentEvents, count: recentEventsCount } = await getRecentEvents(address as string, page);
    const uniqRecentEvents = uniqBy(recentEvents, "trigger_unit");

    return {
      recentEvents: uniqRecentEvents,
      recentEventsCount,
    };
  }
  return undefined;
});
