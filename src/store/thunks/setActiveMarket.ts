import { createAsyncThunk } from "@reduxjs/toolkit";
import moment from "moment";

import backend from "services/backend";
import obyte from "services/obyte";
import http from "services/http";
import { getCurrencyMarketData, getCurrencyPrice } from "services/marketData";

import { setActiveMarketAddress } from "store/slices/activeSlice";
import { saveBaseOHLC } from "store/slices/settingsSlice";
import type { AppThunkApiConfig } from "store/hooks";
import type { Candle, CurrencyCandle, MarketParams, MarketStateVars, RecentEvent, Team } from "store/types";

import appConfig from "appConfig";

const initialParams = {
  allow_draw: false,
  comparison: "==",
  reserve_asset: "base",
  waiting_period_length: 5 * 24 * 3600,
  issue_fee: 0.01,
  redeem_fee: 0.02,
  arb_profit_tax: 0.9,
  datafeed_draw_value: "none",
};

type TokensInfo = {
  yes_symbol?: string | null;
  no_symbol?: string | null;
  draw_symbol?: string | null;
  reserve_symbol?: string | null;
  yes_decimals?: number | null;
  no_decimals?: number | null;
  draw_decimals?: number | null;
  reserve_decimals?: number | null;
};

type Championship = { code: string; name: string; emblem?: string };

export interface SetActiveMarketResult {
  params: MarketParams;
  stateVars: MarketStateVars;
  base_aa: string;
  dailyCandles: Candle[];
  recentEvents: RecentEvent[];
  recentEventsCount: number;
  datafeedValue: string | null;
  yesTeam: Team | undefined;
  noTeam: Team | undefined;
  currencyCandles: CurrencyCandle[];
  currencyCurrentValue: number;
  created_at: number;
  committed_at: number | undefined;
  first_trade_ts: number | undefined;
  yes_odds: number | null;
  no_odds: number | null;
  draw_odds: number | null;
  yes_crest_url: string | null;
  no_crest_url: string | null;
  league: { league_emblem: string | null | undefined; league: string | null | undefined };
}

export const setActiveMarket = createAsyncThunk<SetActiveMarketResult, { address: string }, AppThunkApiConfig>("setActiveMarket", async ({ address }, { dispatch, getState }) => {
  dispatch(setActiveMarketAddress(address));
  const state = getState();

  const [aa, stateVars] = await Promise.all([http.getDefinition(address), http.getStateVars(address)]);

  const base_aa: string = aa[1].base_aa;
  const reserve_asset: string = aa[1].params.reserve_asset || "base";

  if (!(appConfig.BASE_AAS ?? []).includes(base_aa)) throw new Error("unknown base aa");

  const tokenRegistry: string = obyte.api.getOfficialTokenRegistryAddress();

  const tokensInfo: TokensInfo = {};

  const tokensInfoGetters: Promise<unknown>[] = [
    http.getSymbolByAsset(tokenRegistry, stateVars.yes_asset).then((symbol) => (tokensInfo.yes_symbol = symbol)),
    http.getSymbolByAsset(tokenRegistry, stateVars.no_asset).then((symbol) => (tokensInfo.no_symbol = symbol)),
    http.getSymbolByAsset(tokenRegistry, reserve_asset).then((symbol) => (tokensInfo.reserve_symbol = symbol)),
    http
      .getDecimalsBySymbolOrAsset(tokenRegistry, stateVars.yes_asset)
      .then((decimals) => (tokensInfo.yes_decimals = decimals))
      .catch(() => (tokensInfo.yes_decimals = null)),
    http
      .getDecimalsBySymbolOrAsset(tokenRegistry, stateVars.no_asset)
      .then((decimals) => (tokensInfo.no_decimals = decimals))
      .catch(() => (tokensInfo.no_decimals = null)),
    http
      .getDecimalsBySymbolOrAsset(tokenRegistry, reserve_asset)
      .then((decimals) => (tokensInfo.reserve_decimals = decimals))
      .catch(() => (tokensInfo.reserve_decimals = null)),
  ];

  if (aa[1].params.allow_draw && stateVars.draw_asset) {
    tokensInfoGetters.push(
      http.getSymbolByAsset(tokenRegistry, stateVars.draw_asset).then((symbol) => (tokensInfo.draw_symbol = symbol)),
      http
        .getDecimalsBySymbolOrAsset(tokenRegistry, stateVars.draw_asset)
        .then((decimals) => (tokensInfo.draw_decimals = decimals))
        .catch(() => (tokensInfo.draw_decimals = 0))
    );
  }

  await Promise.all(tokensInfoGetters);

  const params = { ...initialParams, ...aa[1].params, ...tokensInfo };

  if (!params.yes_decimals) params.yes_decimals = params.reserve_decimals;
  if (!params.no_decimals) params.no_decimals = params.reserve_decimals;
  if (!params.draw_decimals) params.draw_decimals = params.reserve_decimals;

  const [dailyCandles, { data: recentEvents, count: recentEventsCount }, datafeedValue] = await Promise.all([
    backend
      .getDailyCandles(address)
      .then((data) => data as Candle[])
      .catch((): Candle[] => []),
    backend.getRecentEvents(address),
    http.getDataFeed([params.oracle], params.feed_name, "none"),
    obyte.justsaying("light/new_aa_to_watch", {
      aa: address,
    }),
  ]);

  const isSportMarket = !!appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === params.oracle);
  const isCurrencyMarket = !!appConfig.CATEGORIES.currency.oracles.find(({ address }) => address === params.oracle);
  const isPreciousMetalMarket = !!appConfig.PRECIOUS_METAL_ORACLE && params.oracle === appConfig.PRECIOUS_METAL_ORACLE;

  const isHourlyChart = params.event_date + params.waiting_period_length - moment.utc().unix() <= 7 * 24 * 3600;

  let yesTeam: Team | undefined;
  let noTeam: Team | undefined;
  let currencyCandles: CurrencyCandle[] = [];
  let currencyCurrentValue = 0;
  let league_emblem: string | null | undefined = null;
  let league: string | null | undefined = null;

  let yes_odds: number | null = null;
  let no_odds: number | null = null;
  let draw_odds: number | null = null;
  let yes_crest_url: string | null = null;
  let no_crest_url: string | null = null;

  const dates = await backend.getDates(address);

  const created_at: number = dates.created_at;
  const committed_at: number | undefined = dates.committed_at;
  const first_trade_ts: number | undefined = await backend.getFirstTradeTs(address);

  if (isSportMarket) {
    if (!yes_odds || !no_odds || !draw_odds) {
      const odds = await backend.getBookmakerOdds("soccer", params.feed_name);

      if (odds) {
        yes_odds = odds.yes_odds;
        no_odds = odds.no_odds;
        draw_odds = odds.draw_odds;
      }
    }

    const [championship, yes_abbreviation, no_abbreviation] = (params.feed_name as string).split("_");
    const championships: Record<string, Championship[]> = await backend.getChampionships();

    const sport = Object.entries(championships).find(([, cs]) => cs.find(({ code }) => code === championship));

    if (sport) {
      const championshipData = championships[sport[0]].find(({ code }) => code === championship);
      league_emblem = championshipData?.emblem;
      league = championshipData?.name;

      try {
        [yesTeam, noTeam] = await Promise.all([backend.getTeam(sport[0], yes_abbreviation), backend.getTeam(sport[0], no_abbreviation)]);

        [yes_crest_url, no_crest_url] = await Promise.all([backend.getCrest(sport[0], championship, yesTeam!.id), backend.getCrest(sport[0], championship, noTeam!.id)]);
      } catch {
        console.error("error get teams id");
      }
    }
  } else if (isCurrencyMarket) {
    const [from, to] = (params.feed_name as string).split("_");
    const now = moment.utc().unix();

    try {
      if (isPreciousMetalMarket) {
        // Current rate comes from the oracle's own feed value (the metal itself), not an external token.
        currencyCurrentValue = datafeedValue !== "none" ? Number(datafeedValue) : 0;
        // Chart history via a tokenized-metal proxy (PAXG/KAG) through the existing provider chain.
        const { candles } = await getCurrencyMarketData({ from, to, isHourlyChart, committed_at, proxyPreciousMetal: true });
        currencyCandles = candles;
      } else if (from === "GBYTE" && params.event_date > now) {
        // GBYTE live market: keep the 20-min baseOHLC cache, resolve via the provider chain.
        const baseOHLC = state.settings?.baseOHLC;
        if ((baseOHLC?.expireTs || 0) > Math.floor(Date.now() / 1000)) {
          currencyCandles = baseOHLC?.data || [];
          currencyCurrentValue = await getCurrencyPrice({ from, to });
        } else {
          const { candles, currentValue } = await getCurrencyMarketData({ from, to, isHourlyChart, committed_at });

          if (candles.length) dispatch(saveBaseOHLC(candles)); // don't cache an empty result for 20 min

          currencyCandles = candles;
          currencyCurrentValue = currentValue;
        }
      } else {
        const { candles, currentValue } = await getCurrencyMarketData({ from, to, isHourlyChart, committed_at });

        currencyCandles = candles;
        currencyCurrentValue = currentValue;
      }
    } catch {
      console.log(`no candles for ${from}->${to}`);
    }
  }

  return {
    params,
    stateVars: stateVars as MarketStateVars,
    base_aa,
    dailyCandles,
    recentEvents: recentEvents as RecentEvent[],
    recentEventsCount,
    datafeedValue: datafeedValue !== "none" ? datafeedValue : null,
    yesTeam,
    noTeam,
    currencyCandles,
    currencyCurrentValue,
    created_at,
    committed_at,
    first_trade_ts,
    yes_odds,
    no_odds,
    draw_odds,
    yes_crest_url,
    no_crest_url,
    league: {
      league_emblem,
      league,
    },
  };
});
