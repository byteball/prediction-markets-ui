import { createAsyncThunk } from "@reduxjs/toolkit";
import { uniqBy } from "lodash";

import backend from "services/backend";

export const loadMoreRecentEvents = createAsyncThunk(
    'loadMoreRecentEvents',
    async ({ address, page }, { getState }) => {
        const state = getState();
        if (address === state.active.address) {
            const { data: recentEvents, count: recentEventsCount } = await backend.getRecentEvents(address, page);
            const uniqRecentEvents = uniqBy(recentEvents, 'trigger_unit')

            return ({
                recentEvents: uniqRecentEvents,
                recentEventsCount
            })
        }
    }
)