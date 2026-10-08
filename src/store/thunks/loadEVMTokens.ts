import { createAsyncThunk } from "@reduxjs/toolkit";
import appConfig from "appConfig";
import { groupBy } from "lodash-es";

import type { Bridge } from "store/types";

export const loadEVMTokens = createAsyncThunk<Record<string, Bridge[]>, void>(
  'loadEVMTokens',
  async () => {
    const { getBridges } = await import("counterstake-sdk");
    const bridges: Bridge[] = await getBridges(appConfig.ENVIRONMENT === "testnet", true);
    const filteredBridges = bridges.filter(({ home_network, foreign_network }) => home_network !== 'Obyte' && foreign_network === 'Obyte');

    return groupBy(filteredBridges, 'home_network')
  }
)
