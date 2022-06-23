import { createAsyncThunk } from "@reduxjs/toolkit";
import appConfig from "appConfig";
import { getBridges } from "counterstake-sdk";
import { groupBy } from "lodash";

export const loadEVMTokens = createAsyncThunk(
  'loadEVMTokens',
  async () => {
    const bridges = await getBridges(appConfig.ENVIRONMENT === "testnet", true);
    const filteredBridges = bridges.filter(({ home_network, foreign_network }) => home_network !== 'Obyte' && foreign_network === 'Obyte');

    return groupBy(filteredBridges, 'home_network')
  }
)