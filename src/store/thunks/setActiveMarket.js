import { createAsyncThunk } from "@reduxjs/toolkit";
import { isEmpty } from "lodash";
import axios from "axios";
import moment from "moment";

import backend from "services/backend";
import obyte from "services/obyte";

import { setActiveMarketAddress } from "store/slices/activeSlice";

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
  async (address, { dispatch, getState }) => {
    dispatch(setActiveMarketAddress(address))
    const state = getState();
    const marketInList = state.markets.allMarkets?.find(({ aa_address }) => aa_address === address);

    const aa = await obyte.api.getDefinition(address);
    const stateVars = await obyte.api.getAaStateVars({ address })
    const base_aa = aa[1].base_aa;
    const reserve_asset = aa[1].params.reserve_asset || 'base';

    if (!appConfig.BASE_AAS.includes(base_aa)) throw new Error("unknown base aa");

    const tokenRegistry = obyte.api.getOfficialTokenRegistryAddress();

    const tokensInfo = {};
    let tokensInfoGetters = [];

    if (marketInList) {
      tokensInfo.yes_symbol = marketInList.yes_symbol;
      tokensInfo.no_symbol = marketInList.no_symbol;
      tokensInfo.reserve_symbol = marketInList.reserve_symbol;

      tokensInfo.yes_decimals = marketInList.yes_decimals;
      tokensInfo.no_decimals = marketInList.no_decimals;
      tokensInfo.reserve_decimals = marketInList.reserve_decimals;

    } else {
      tokensInfoGetters = [
        obyte.api.getSymbolByAsset(tokenRegistry, stateVars.yes_asset).then(symbol => tokensInfo.yes_symbol = symbol),
        obyte.api.getSymbolByAsset(tokenRegistry, stateVars.no_asset).then(symbol => tokensInfo.no_symbol = symbol),
        obyte.api.getSymbolByAsset(tokenRegistry, reserve_asset).then(symbol => tokensInfo.reserve_symbol = symbol),
        obyte.api.getDecimalsBySymbolOrAsset(tokenRegistry, stateVars.yes_asset).then(decimals => tokensInfo.yes_decimals = decimals).catch(() => tokensInfo.yes_decimals = null),
        obyte.api.getDecimalsBySymbolOrAsset(tokenRegistry, stateVars.no_asset).then(decimals => tokensInfo.no_decimals = decimals).catch(() => tokensInfo.no_decimals = null),
        obyte.api.getDecimalsBySymbolOrAsset(tokenRegistry, reserve_asset).then(decimals => tokensInfo.reserve_decimals = decimals).catch(() => tokensInfo.reserve_decimals = null),
      ]
    }

    if (aa[1].params.allow_draw && stateVars.draw_asset) {
      if (marketInList) {
        tokensInfo.draw_symbol = marketInList.draw_symbol;
        tokensInfo.draw_decimals = marketInList.draw_decimals;
      } else {
        tokensInfoGetters.push(
          obyte.api.getSymbolByAsset(tokenRegistry, stateVars.draw_asset).then(symbol => tokensInfo.draw_symbol = symbol),
          obyte.api.getDecimalsBySymbolOrAsset(tokenRegistry, stateVars.draw_asset).then(decimals => tokensInfo.draw_decimals = decimals).catch(() => tokensInfo.draw_decimals = 0)
        );
      }
    }

    await Promise.all(tokensInfoGetters);

    const params = { ...initialParams, ...aa[1].params, ...tokensInfo };

    if (!params.yes_decimals) params.yes_decimals = params.reserve_decimals;
    if (!params.no_decimals) params.no_decimals = params.reserve_decimals;
    if (!params.draw_decimals) params.draw_decimals = params.reserve_decimals;

    const [dailyCloses, recentResponses, datafeedValue] = await Promise.all([
      backend.getDailyCloses(address).then((data) => data).catch(() => []),
      obyte.api.getAaResponses({ aa: address }),
      obyte.api.getDataFeed({ oracles: [params.oracle], feed_name: params.feed_name, ifnone: 'none' })
    ]);

    await obyte.justsaying("light/new_aa_to_watch", {
      aa: address
    });

    const isSportMarket = !!appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === params.oracle);
    const isCurrencyMarket = !!appConfig.CATEGORIES.currency.oracles.find(({ address }) => address === params.oracle);

    const isHourlyChart = params.event_date + params.waiting_period_length - moment.utc().unix() <= 7 * 24 * 3600;

    let yesTeam;
    let noTeam;
    let currencyCandles = [];
    let currencyCurrentValue = 0;
    let league_emblem = null;
    let league = null;

    if (isSportMarket) {
      const [championship, yes_abbreviation, no_abbreviation] = params.feed_name.split("_");
      let championships = state.markets.championships;

      if (isEmpty(championships)) {
        championships = await backend.getChampionships();
      }

      const sport = Object.entries(championships).find(([_, cs]) => cs.find(({ code }) => code === championship))//?.[0];

      if (sport) {
        const championshipData = championships[sport[0]].find(({ code }) => code === championship);
        league_emblem = championshipData?.emblem;
        league = championshipData?.name;

        try {
          yesTeam = await backend.getTeam(sport[0], yes_abbreviation);
          noTeam = await backend.getTeam(sport[0], no_abbreviation);
        } catch (e) {
          console.error('error get teams id');
        }
      }
    } else if (isCurrencyMarket) {
      const [from, to] = params.feed_name.split("_");

      try {
        const cryptocompare = await Promise.all([
          axios.get(`https://min-api.cryptocompare.com/data/v2/${isHourlyChart ? 'histohour' : 'histoday'}?fsym=${from}&tsym=${to}&limit=${isHourlyChart ? 168 : 30}`).then(({ data }) => data?.Data?.Data),
          axios.get(`https://min-api.cryptocompare.com/data/price?fsym=${from}&tsyms=${to}`).then(({ data }) => data?.[to])
        ]);

        currencyCandles = cryptocompare[0];
        currencyCurrentValue = cryptocompare[1];
      } catch {
        console.log(`no candles for ${from}->${to}`)
      }
    }

    let created_at;
    let committed_at;

    if (marketInList) {
      created_at = marketInList.created_at;
      committed_at = marketInList.committed_at;
    } else {
      const dates = await backend.getDates(address);
      created_at = dates.created_at;
      committed_at = dates.committed_at;
    }

    return {
      params,
      stateVars,
      dailyCloses,
      recentResponses,
      datafeedValue: datafeedValue !== 'none' ? datafeedValue : null,
      yesTeam,
      noTeam,
      currencyCandles,
      currencyCurrentValue,
      created_at,
      committed_at,
      league: {
        league_emblem,
        league
      }
    }
  })