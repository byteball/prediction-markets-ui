import { createAsyncThunk } from "@reduxjs/toolkit";

import backend from "services/backend";
import obyte from "services/obyte";

import { setActiveMarketAddress } from "store/slices/activeSlice";
import { responseToEvent } from "utils/responseToEvent";

import appConfig from "appConfig";

const initialParams = {
  allow_draw: false,
  comparison: '==',
  reserve_asset: 'base',
  waiting_period_length: 5 * 24 * 3600,
  issue_fee: 0.01,
  redeem_fee: 0.02,
  arb_profit_tax: 0.9,
  datafeed_draw_value: 'none'
};

export const setActiveMarket = createAsyncThunk(
  'setActiveMarket',
  async (address, { dispatch }) => {
    dispatch(setActiveMarketAddress(address))

    const aa = await obyte.api.getDefinition(address);
    const stateVars = await obyte.api.getAaStateVars({ address })
    const base_aa = aa[1].base_aa;
    const reserve_asset = aa[1].params.reserve_asset || 'base';

    if (base_aa !== appConfig.BASE_AA) throw new Error("unknown base aa");

    const tokenRegistry = obyte.api.getOfficialTokenRegistryAddress();

    const tokensInfo = {};

    const tokensInfoGetters = [
      obyte.api.getSymbolByAsset(tokenRegistry, stateVars.yes_asset).then(symbol => tokensInfo.yes_symbol = symbol),
      obyte.api.getSymbolByAsset(tokenRegistry, stateVars.no_asset).then(symbol => tokensInfo.no_symbol = symbol),
      obyte.api.getSymbolByAsset(tokenRegistry, reserve_asset).then(symbol => tokensInfo.reserve_symbol = symbol),
      obyte.api.getDecimalsBySymbolOrAsset(tokenRegistry, stateVars.yes_asset).then(decimals => tokensInfo.yes_decimals = decimals).catch(() => tokensInfo.yes_decimals = null),
      obyte.api.getDecimalsBySymbolOrAsset(tokenRegistry, stateVars.no_asset).then(decimals => tokensInfo.no_decimals = decimals).catch(() => tokensInfo.no_decimals = null),
      obyte.api.getDecimalsBySymbolOrAsset(tokenRegistry, reserve_asset).then(decimals => tokensInfo.reserve_decimals = decimals).catch(() => tokensInfo.reserve_decimals = null),
    ]

    if (aa[1].params.allow_draw && stateVars.draw_asset) {
      tokensInfoGetters.push(
        obyte.api.getSymbolByAsset(tokenRegistry, stateVars.draw_asset).then(symbol => tokensInfo.draw_symbol = symbol),
        obyte.api.getDecimalsBySymbolOrAsset(tokenRegistry, stateVars.draw_asset).then(decimals => tokensInfo.draw_decimals = decimals).catch(() => tokensInfo.draw_decimals = 0)
      );
    }

    await Promise.all(tokensInfoGetters);

    const params = { ...initialParams, ...aa[1].params, ...tokensInfo };

    if (!params.yes_decimals) params.yes_decimals = params.reserve_decimals
    if (!params.no_decimals) params.no_decimals = params.reserve_decimals
    if (!params.draw_decimals) params.draw_decimals = params.reserve_decimals

    const category = await backend.getCategory(address);

    const dailyCandles = await backend.getDailyCandles(address);

    const responses = await obyte.api.getAaResponses({ aa: address });

    let recentEvents = responses.filter((res) => !res.response?.error).map((res) => responseToEvent(res, params, stateVars))
    const firstConfigureEvent = recentEvents.find((ev) => ev.event === 'Configuration');
    recentEvents = [...recentEvents.filter((ev) => ev.event !== 'Configuration'), firstConfigureEvent];

    await obyte.justsaying("light/new_aa_to_watch", {
      aa: address
    });

    const datafeedValue = await obyte.api.getDataFeed({ oracles: [params.oracle], feed_name: params.feed_name, ifnone: 'none' })

    return {
      params,
      stateVars,
      category,
      dailyCandles,
      recentEvents,
      datafeedValue: datafeedValue !== 'none' ? datafeedValue : null
    }
  })