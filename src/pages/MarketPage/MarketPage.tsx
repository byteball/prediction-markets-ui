import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Line, type LineConfig } from "@ant-design/plots";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import moment from "moment";
import { Img } from "react-image";
import { Helmet } from "react-helmet-async";
import { kebabCase } from "lodash";
import { Trans, useTranslation } from "react-i18next";
import { Loader2, TriangleAlert } from "lucide-react";
import { cn } from "cn";

import { StatsCard } from "components/StatsCard/StatsCard";
import { QRButton } from "components/QRButton/QRButton";
import { RecentEvents } from "components/RecentEvents/RecentEvents";
import { CurrencyChart } from "components/CurrencyChart/CurrencyChart";
import { MarketSizePie } from "components/MarketSizePie/MarketSizePie";
import { PageProvider } from "components/PageProvider/PageProvider";
import { AddLiquidityModal, ClaimProfitModal, ViewParamsModal, TradeModal } from "modals";
import type { TradeModalVisible } from "modals/TradeModal";

import {
  selectActiveAddress,
  selectActiveCurrencyCandles,
  selectActiveCurrencyCurrentValue,
  selectActiveDailyCandles,
  selectActiveDatafeedValue,
  selectActiveMarketParams,
  selectActiveMarketStateVars,
  selectActiveMarketStatus,
  selectActiveTeams,
} from "store/slices/activeSlice";
import { setActiveMarket } from "store/thunks/setActiveMarket";
import { selectLanguage, selectPriceOrOdds, selectReserveAssets, selectReservesRate } from "store/slices/settingsSlice";
import { useAppDispatch } from "store/hooks";
import { getMarketPriceByType, generateLink, generateTextEvent, getEstimatedAPY, transformChampionshipName } from "utils";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/ui/countdown";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import i18n from "locale";
import appConfig from "appConfig";

import styles from "./MarketPage.module.css";

const SECONDS_IN_YEAR = 31536000;

type ChartType = "prices" | "supplies" | "fee" | "apy";

type ChartPoint = {
  date: string;
  value: number;
  chartType: ChartType;
  type?: string;
  currencySymbol?: string;
  symbol?: string;
};

type Teams = { yes?: { name: string } | null; no?: { name: string } | null };

const getConfig = (chartType: ChartType, teams: Teams) =>
  ({
    xField: "date",
    yField: "value",
    seriesField: "type",
    autoFit: true,
    animation: false,
    renderer: "svg",
    smooth: true,
    appendPadding: 5,
    theme: "dark",
    map: { style: "dark" },
    color: ({ type }: { type: string }) => {
      if (chartType === "apy") return appConfig.YES_COLOR;

      return type === i18n.t("common.no", "no").toUpperCase() || type === teams?.no?.name
        ? appConfig.NO_COLOR
        : type === i18n.t("common.yes", "yes").toUpperCase() || type === teams?.yes?.name
          ? appConfig.YES_COLOR
          : appConfig.DRAW_COLOR;
    },
    yAxis: {
      label: {
        formatter: (v: string) => (chartType === "fee" || chartType === "apy" ? `${v}%` : v),
      },
    },
    tooltip: {
      customContent: (title: string, items: { color: string; data: ChartPoint }[]) => (
        <>
          <p style={{ marginTop: 16 }}>{title}</p>
          <ul style={{ paddingLeft: 0 }}>
            {items?.map((item, index) => {
              const {
                color,
                data: { currencySymbol, chartType, value, symbol, type, date },
              } = item;
              const valueView =
                chartType === "fee" || chartType === "apy"
                  ? `${Number(value) > 1e15 ? value.toPrecision(9) : (+Number(value).toPrecision(9)).toLocaleString("en-US")}%`
                  : `${+value.toPrecision(9)} ${currencySymbol}`;

              return (
                <li key={`${chartType}-${type}-${date}`} data-index={index} style={{ marginBottom: 12, display: "flex", alignItems: "center" }}>
                  <span className="g2-tooltip-marker" style={{ backgroundColor: color }}></span>
                  <span style={{ display: "inline-flex", flex: 1, justifyContent: "space-between" }}>
                    {chartType === "prices" && (
                      <span className="g2-tooltip-list-item--4">
                        <div style={{ paddingRight: 15 }}>{symbol}</div>
                      </span>
                    )}
                    <span className="g2-tooltip-list-item-value">{valueView}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      ),
    },
  }) as unknown as LineConfig;

const Spinner = () => (
  <div style={{ margin: 40, display: "flex", justifyContent: "center" }}>
    <Loader2 className="size-8 animate-spin text-primary" aria-label="loading" />
  </div>
);

const StatsCell = ({ children }: { children: ReactNode }) => <div style={{ marginBottom: 30 }}>{children}</div>;

export const MarketPage = () => {
  const location = useLocation();
  let address: string | undefined;

  const regex = /(\w{32})$/;
  const match = location.pathname.match(regex);

  if (match) {
    address = match[0];
  }

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [chartType, setChartType] = useState<ChartType>("prices");
  const [visibleTradeModal, setVisibleTradeModal] = useState<TradeModalVisible>(false);

  const status = useSelector(selectActiveMarketStatus);
  const reserveAssets = useSelector(selectReserveAssets);
  const stateVars = useSelector(selectActiveMarketStateVars);

  const candles = useSelector(selectActiveDailyCandles);
  const datafeedValue = useSelector(selectActiveDatafeedValue);

  const activeAddress = useSelector(selectActiveAddress);
  const teams: Teams = useSelector(selectActiveTeams);
  const currencyCandles = useSelector(selectActiveCurrencyCandles);
  const currencyCurrentValue = useSelector(selectActiveCurrencyCurrentValue);

  const params = useSelector(selectActiveMarketParams);

  const priceOrOdds = useSelector(selectPriceOrOdds);

  const currentLang = useSelector(selectLanguage);

  const chartConfig = getConfig(chartType, teams);

  const {
    reserve_asset = "base",
    allow_draw,
    quiet_period = 0,
    reserve_symbol,
    reserve_decimals,
    yes_decimals,
    no_decimals,
    draw_decimals,
    yes_symbol,
    no_symbol,
    draw_symbol,
    event_date,
    league,
    league_emblem,
    created_at,
    committed_at,
    oracle,
    base_aa,
    issue_fee,
    first_trade_ts,
    yes_odds = null,
    no_odds = null,
    draw_odds = null,
    yes_crest_url = null,
    no_crest_url = null,
  } = params;

  const actualReserveSymbol = reserveAssets[reserve_asset]?.symbol;

  const reservesRate = useSelector(selectReservesRate);

  const reserve_rate = reservesRate[reserve_asset] || 0;

  const event = generateTextEvent({ ...params, yes_team_name: teams?.yes?.name, no_team_name: teams?.no?.name });
  const eventUTC = generateTextEvent({ ...params, yes_team_name: teams?.yes?.name, no_team_name: teams?.no?.name, isUTC: true });

  const { reserve = 0, result, supply_yes = 0, supply_no = 0, supply_draw = 0, coef = 1 } = stateVars;
  const viewReserve = +Number(reserve / 10 ** reserve_decimals).toPrecision(5);
  const viewReserveInUSD = "$" + +Number((reserve / 10 ** reserve_decimals) * reserve_rate).toPrecision(2);

  const yesPrice = +getMarketPriceByType(stateVars, "yes").toFixed(reserve_decimals);
  const noPrice = +getMarketPriceByType(stateVars, "no").toFixed(reserve_decimals);
  const drawPrice = +getMarketPriceByType(stateVars, "draw").toFixed(reserve_decimals);

  const yesPriceInUSD = +Number(yesPrice * reserve_rate).toPrecision(4);
  const noPriceInUSD = +Number(noPrice * reserve_rate).toPrecision(4);
  const drawPriceInUSD = +Number(drawPrice * reserve_rate).toPrecision(4);

  const isSportMarket = !!appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === params.oracle);
  const isCurrencyMarket = !!appConfig.CATEGORIES.currency.oracles.find(({ address }) => address === params.oracle);

  let tradeStatus: string;
  let tradeStatusColor: string;
  let tradeTimerExpiry: number | undefined;
  let tradeIsActive = false;
  let showCommitResultButton = false;
  let showClaimProfitButton = false;

  const [now, setNow] = useState(moment.utc().unix());
  const sevenDaysAlreadyPassed = now > params.event_date + 3600 * 24 * 7;

  const commitResultLink = generateLink({ aa: address, amount: 1e4, data: { commit: 1 } });

  const dataForChart = useMemo<ChartPoint[]>(() => {
    let candlesData = candles;

    const data: ChartPoint[] = [];

    if (candlesData.length === 1 && chartType !== "apy") {
      candlesData = [candles[0], { ...candlesData[0], start_timestamp: candlesData[0].start_timestamp - 3600 }];
    }

    if (candlesData.length > 0 && chartType === "fee") {
      data.push({ date: moment.unix(created_at).format(sevenDaysAlreadyPassed ? "ll" : "lll"), value: 0, chartType });
    }

    const last_close_ts = committed_at ? committed_at : candlesData[candlesData.length - 1]?.start_timestamp;
    const needsIssueFeeForLiquidity = (appConfig.BASE_AAS ?? []).findIndex((address) => address === base_aa) === 0;

    let coef_end: number;

    const first_trade_at = first_trade_ts || created_at;

    if (result || (event_date + params.waiting_period_length > now && event_date <= now)) {
      coef_end = coef * (1 - (needsIssueFeeForLiquidity ? issue_fee : 0));
    } else {
      coef_end = (coef * (1 - (needsIssueFeeForLiquidity ? issue_fee : 0))) ** (((committed_at || event_date) - first_trade_at) / (last_close_ts - first_trade_at));
    }

    candlesData.forEach(
      ({
        start_timestamp: open_ts,
        open_yes_price: yes_price,
        open_no_price: no_price,
        open_draw_price: draw_price,
        open_supply_yes: supply_yes,
        open_supply_no: supply_no,
        open_supply_draw: supply_draw,
        open_coef,
      }: {
        start_timestamp: number;
        open_yes_price: number;
        open_no_price: number;
        open_draw_price: number;
        open_supply_yes: number;
        open_supply_no: number;
        open_supply_draw: number;
        open_coef: number;
      }) => {
        const date = moment.unix(open_ts).format((committed_at || now) > (first_trade_ts || created_at) + 3600 * 24 * 30 ? "ll" : "lll");

        if (chartType === "prices") {
          data.push(
            { date, value: yes_price, type: teams?.yes?.name || i18n.t("common.yes", "yes").toUpperCase(), currencySymbol: reserve_symbol, chartType, symbol: yes_symbol },
            { date, value: no_price, type: teams?.no?.name || i18n.t("common.no", "no").toUpperCase(), currencySymbol: reserve_symbol, chartType, symbol: no_symbol }
          );

          if (allow_draw) {
            data.push({ date, value: draw_price, type: i18n.t("common.draw", "draw").toUpperCase(), currencySymbol: reserve_symbol, chartType, symbol: draw_symbol });
          }
        } else if (chartType === "fee") {
          data.push({ date, value: (open_coef - 1) * 100, chartType });
        } else if (chartType === "apy") {
          const capitalGain = coef_end / (open_coef * (1 - (needsIssueFeeForLiquidity ? issue_fee : 0)));

          const time_left = (committed_at || event_date) - open_ts;

          const apy = (capitalGain ** (SECONDS_IN_YEAR / time_left) - 1) * 100;

          data.push({ date, value: apy || 0, chartType });
        } else {
          data.push(
            { date, value: +Number(supply_yes / 10 ** yes_decimals).toFixed(yes_decimals), type: teams?.yes?.name || i18n.t("common.yes", "yes").toUpperCase(), currencySymbol: yes_symbol, chartType },
            { date, value: +Number(supply_no / 10 ** no_decimals).toFixed(no_decimals), type: teams?.no?.name || i18n.t("common.no", "no").toUpperCase(), currencySymbol: no_symbol, chartType }
          );

          if (allow_draw) {
            data.push({ date, value: +Number(supply_draw / 10 ** draw_decimals).toFixed(draw_decimals), type: i18n.t("common.draw", "draw").toUpperCase(), currencySymbol: draw_symbol, chartType });
          }
        }
      }
    );

    return data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, chartType, address, reservesRate, teams, i18n.language]);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(moment.utc().unix()), 10000);

    return () => clearInterval(intervalId);
  }, []);

  if (params.event_date - quiet_period > now) {
    tradeStatus = t("common.status.trading", "trading").toUpperCase();
    tradeStatusColor = appConfig.YES_COLOR;
    tradeTimerExpiry = params.event_date;
    tradeIsActive = true;
    showCommitResultButton = false;
  } else if (params.event_date > now) {
    tradeStatus = t("common.status.quiet_period", "quiet period").toUpperCase();
    tradeStatusColor = "#e58e26";
  } else if (result) {
    tradeStatus = t("common.status.claiming", "Claiming profit").toUpperCase();
    showClaimProfitButton = true;
    tradeStatusColor = appConfig.YES_COLOR;
  } else if (params.event_date + params.waiting_period_length > now) {
    tradeStatus = t("common.status.waiting", "Waiting for results").toUpperCase();
    tradeStatusColor = "#e58e26";
    tradeTimerExpiry = params.event_date + params.waiting_period_length;
    showCommitResultButton = true;
  } else {
    tradeStatus = t("common.status.resumed", "Resumed trading").toUpperCase();
    tradeStatusColor = appConfig.YES_COLOR;
    showCommitResultButton = true;
    tradeIsActive = true;
  }

  useEffect(() => {
    if (address && activeAddress !== address) {
      dispatch(setActiveMarket({ address }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  if (status !== "loaded" || !address || !actualReserveSymbol) return <Spinner />;

  // calc odds
  let yesOddsView: number | null = 0;
  let drawOddsView: number | null = 0;
  let noOddsView: number | null = 0;

  if (reserve !== 0) {
    yesOddsView = supply_yes !== 0 ? +Number(reserve / supply_yes / yesPrice).toFixed(5) : null;
    drawOddsView = supply_draw !== 0 ? +Number(reserve / supply_draw / drawPrice).toFixed(5) : null;
    noOddsView = supply_no !== 0 ? +Number(reserve / supply_no / noPrice).toFixed(5) : null;
  }

  const yesToWinPrice = supply_yes ? +Number(reserve / supply_yes).toFixed(4) : 0;
  const noToWinPrice = supply_no ? +Number(reserve / supply_no).toFixed(4) : 0;
  const drawToWinPrice = supply_draw ? +Number(reserve / supply_draw).toFixed(4) : 0;

  const yesToWinPriceInUSD = reserve_rate ? `$${+Number(yesToWinPrice * reserve_rate).toFixed(4)}` : "";
  const noToWinPriceInUSD = reserve_rate ? `$${+Number(noToWinPrice * reserve_rate).toFixed(4)}` : "";
  const drawToWinPriceInUSD = reserve_rate ? `$${+Number(drawToWinPrice * reserve_rate).toFixed(4)}` : "";

  const showYesToWin = !result && priceOrOdds === "price" && reserve && supply_yes;
  const showNoToWin = !result && priceOrOdds === "price" && reserve && supply_no;
  const showDrawToWin = !result && priceOrOdds === "price" && reserve && supply_draw;

  const haveTeamNames = isSportMarket && teams?.yes?.name && teams?.no?.name;

  const apy = getEstimatedAPY({ coef, params });
  const apyView = apy < 1e15 ? (+Number(apy).toPrecision(9)).toLocaleString("en-US") : apy;

  let yesTooltip: string;
  let noTooltip: string;
  let drawTooltip: string;

  if (haveTeamNames) {
    const yes_team_name = teams.yes!.name;
    const no_team_name = teams.no!.name;

    if (priceOrOdds === "price") {
      yesTooltip = t("pages.market.sport_price_tooltip", "The price of the {{team_name}} token. If {{team_name}} wins, all funds paid by buyers of all tokens will be divided among {{team_name}} token holders.", { team_name: yes_team_name });
      noTooltip = t("pages.market.sport_price_tooltip", "The price of the {{team_name}} token. If {{team_name}} wins, all funds paid by buyers of all tokens will be divided among {{team_name}} token holders.", { team_name: no_team_name });
      drawTooltip = t("pages.market.sport_price_tooltip_draw", "The price of the draw token. In case of a draw, all funds paid by buyers of all tokens will be divided among draw token holders.");
    } else {
      yesTooltip = t("pages.market.sport_odds_tooltip", "The multiple you receive if you bet on {{team_name}} and it wins, assuming the odds don’t change.", { team_name: yes_team_name });
      noTooltip = t("pages.market.sport_odds_tooltip", "The multiple you receive if you bet on {{team_name}} and it wins, assuming the odds don’t change.", { team_name: no_team_name });
      drawTooltip = t("pages.market.sport_odds_tooltip_draw", "The multiple you receive if you bet on draw and your bet wins, assuming the odds don’t change.");
    }
  } else {
    if (priceOrOdds === "price") {
      yesTooltip = t("pages.market.price_tooltip", "The price of the token that represents the “{{type}}” outcome. If this outcome wins, all funds paid by buyers of all tokens will be divided among “{{type}}” token holders.", { type: "Yes" });
      noTooltip = t("pages.market.price_tooltip", "The price of the token that represents the “{{type}}” outcome. If this outcome wins, all funds paid by buyers of all tokens will be divided among “{{type}}” token holders.", { type: "No" });
      drawTooltip = t("pages.market.price_tooltip", "The price of the token that represents the “{{type}}” outcome. If this outcome wins, all funds paid by buyers of all tokens will be divided among “{{type}}” token holders.", { type: "Draw" });
    } else {
      yesTooltip = t("pages.market.odds_tooltip", "The multiple you receive if you bet on “{{type}}” outcome and it wins, assuming the odds don’t change.", { type: "Yes" });
      noTooltip = t("pages.market.odds_tooltip", "The multiple you receive if you bet on “{{type}}” outcome and it wins, assuming the odds don’t change.", { type: "No" });
      drawTooltip = t("pages.market.odds_tooltip", "The multiple you receive if you bet on “{{type}}” outcome and it wins, assuming the odds don’t change.", { type: "Draw" });
    }
  }

  let winnerPriceView = 0;
  let winnerOddsView = 0;

  if (result && reserve) {
    const winnerSupply = result === "yes" ? supply_yes : result === "no" ? supply_no : supply_draw;

    if (winnerSupply) {
      winnerPriceView = +Number(reserve / winnerSupply).toPrecision(5);
      winnerOddsView = +Number(reserve ** 2 / (winnerSupply ** 2 * coef ** 2)).toPrecision(5);
    }
  }

  let yesSubValueView = "";
  let noSubValueView = "";
  let drawSubValueView = "";

  if (priceOrOdds === "price" && reserve_rate) {
    yesSubValueView = `$${yesPriceInUSD}`;
    noSubValueView = `$${noPriceInUSD}`;
    if (allow_draw) {
      drawSubValueView = `$${drawPriceInUSD}`;
    }
  } else if (priceOrOdds === "odds" && yes_odds && no_odds && draw_odds && yesOddsView && noOddsView && drawOddsView) {
    yesSubValueView = t("pages.market.bookmaker_odds", `Bookmaker odds: x{{odds}}`, { odds: yes_odds });
    noSubValueView = t("pages.market.bookmaker_odds", `Bookmaker odds: x{{odds}}`, { odds: no_odds });
    drawSubValueView = t("pages.market.bookmaker_odds", `Bookmaker odds: x{{odds}}`, { odds: draw_odds });
  }

  const showMarketSizePie = !result && reserve !== 0;

  const seoText = kebabCase(eventUTC);
  const leagueView = transformChampionshipName(league as string, params.feed_name.split("_")?.[0]);

  const explorerBase = `https://${appConfig.ENVIRONMENT === "testnet" ? "testnet" : ""}explorer.obyte.org`;

  const teamsKnown = !(teams.yes === null || teams.no === null);

  return (
    <>
      <PageProvider />
      <Helmet>
        <title>Prophet prediction markets — {(!teamsKnown ? event : `${teams.yes!.name} vs ${teams.no!.name}`) + `, liquidity provider APY ${apy}%`}</title>
        <link rel="canonical" href={`${window.location.protocol + "//" + window.location.host}/${currentLang !== "en" ? currentLang + "/" : ""}market/${seoText}-${address}`} />
      </Helmet>
      <div style={{ marginTop: 50 }}>
        <h1 className={styles.event}>
          {event}
          {teams?.yes?.name ? " prediction" : null}
        </h1>
        {!teamsKnown ? null : (
          <div style={{ margin: "30px 0", width: "100%" }}>
            <div className="grid grid-cols-3">
              <div className="text-center">
                <div className={styles.emblemWrap}>
                  <Img src={yes_crest_url ?? ""} alt={teams.yes!.name} className={styles.emblem} unloader={<img className={styles.emblem} alt={teams.yes!.name} src="/plug.svg" />} />
                </div>
                <div style={{ paddingTop: 10, lineHeight: 1 }}>
                  <span style={{ color: appConfig.YES_COLOR }}>{teams.yes!.name}</span>
                </div>
              </div>

              <div className="self-center text-center">
                <b className={styles.vs}>{t("common.vs", "VS")}</b>
                <div>{moment.unix(event_date).format(i18n.language === "en" ? "MMM DD, LT" : i18n.language === "zh" ? "MMM Do LT" : "D MMM LT")}</div>
                {league && league_emblem && (
                  <div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <img className={styles.league} src={league_emblem} alt={leagueView} />
                      </TooltipTrigger>
                      <TooltipContent>{leagueView}</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className={styles.emblemWrap}>
                  <Img src={no_crest_url ?? ""} alt={teams.no!.name} className={styles.emblem} unloader={<img className={styles.emblem} alt={teams.no!.name} src="/plug.svg" />} />
                </div>
                <div style={{ paddingTop: 10, lineHeight: 1 }}>
                  <span style={{ color: appConfig.NO_COLOR }}>{teams.no!.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-6" style={{ marginBottom: 20, marginTop: 10 }}>
          <TradeModal visible={visibleTradeModal} setVisible={setVisibleTradeModal} disabled={!tradeIsActive} reserve={reserve} yes_team={teams?.yes?.name} no_team={teams?.no?.name} />
          {showCommitResultButton &&
            (datafeedValue ? (
              <QRButton type="primary" size="large" href={commitResultLink}>
                {t("pages.market.commit_result", "Commit result")}
              </QRButton>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button size="lg" variant="outline" disabled={true}>
                      {t("pages.market.commit_result", "Commit result")}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t("pages.market.not_published", "Oracle has not published results yet")}</TooltipContent>
              </Tooltip>
            ))}
          {showClaimProfitButton && <ClaimProfitModal yes_team={teams?.yes?.name} no_team={teams?.no?.name} />}
          <ViewParamsModal {...params} aa_address={address} />
        </div>

        {!appConfig.KNOWN_ORACLES.includes(oracle) && (
          <Alert className="border-draw/40 bg-draw/10 text-foreground">
            <TriangleAlert className="text-draw" />
            <AlertDescription className="text-foreground">
              <Trans i18nKey="pages.market.unknown_oracle">
                This market uses an oracle{" "}
                <a style={{ color: "#fff" }} href={`${explorerBase}/#${oracle}`} target="_blank" rel="noopener">
                  {oracle}
                </a>{" "}
                that is unknown to this website, trade with care.
              </Trans>
            </AlertDescription>
          </Alert>
        )}

        {isCurrencyMarket && currencyCandles.length > 0 && <CurrencyChart data={currencyCandles} params={params} />}

        <div className={styles.infoWrap}>
          <div className="grid grid-cols-1 gap-x-[30px] md:grid-cols-2 lg:grid-cols-3">
            <StatsCell>
              <StatsCard
                title={`${haveTeamNames ? teams.yes!.name : t("common.yes", "yes")}`}
                tooltip={yesTooltip}
                reserve={reserve}
                isWinner={result ? result === "yes" : undefined}
                subValue={yesSubValueView}
                color={appConfig.YES_COLOR}
                onAction={tradeIsActive ? (action) => setVisibleTradeModal({ type: "yes", action }) : undefined}
                toWinValue={
                  showYesToWin ? (
                    <span>
                      {yesToWinPrice} <small>{reserve_symbol}</small>
                    </span>
                  ) : null
                }
                toWinSubValue={showYesToWin && reserve_rate ? yesToWinPriceInUSD : null}
                value={
                  priceOrOdds === "price" ? (
                    <span>
                      {result ? winnerPriceView : showYesToWin ? +Number(yesPrice).toFixed(4) : yesPrice} <small className={showYesToWin ? styles.symbolWide : ""}>{reserve_symbol}</small>
                    </span>
                  ) : yesOddsView ? (
                    <span>x{result ? winnerOddsView : yesOddsView}</span>
                  ) : (
                    "-"
                  )
                }
              />
            </StatsCell>

            {allow_draw ? (
              <StatsCell>
                <StatsCard
                  title={t("common.draw", "draw")}
                  tooltip={drawTooltip}
                  reserve={reserve}
                  isWinner={result ? result === "draw" : undefined}
                  subValue={drawSubValueView}
                  color={appConfig.DRAW_COLOR}
                  onAction={tradeIsActive ? (action) => setVisibleTradeModal({ type: "draw", action }) : undefined}
                  toWinValue={
                    showDrawToWin ? (
                      <span>
                        {drawToWinPrice} <small>{reserve_symbol}</small>
                      </span>
                    ) : null
                  }
                  toWinSubValue={showDrawToWin && reserve_rate ? drawToWinPriceInUSD : null}
                  value={
                    priceOrOdds === "price" ? (
                      <span>
                        {result ? winnerPriceView : showDrawToWin ? +Number(drawPrice).toFixed(4) : drawPrice} <small className={showDrawToWin ? styles.symbolWide : ""}>{reserve_symbol}</small>
                      </span>
                    ) : drawOddsView ? (
                      <span>x{result ? winnerOddsView : drawOddsView}</span>
                    ) : (
                      "-"
                    )
                  }
                />
              </StatsCell>
            ) : null}

            <StatsCell>
              <StatsCard
                title={`${haveTeamNames ? teams.no!.name : t("common.no", "no")}`}
                tooltip={noTooltip}
                reserve={reserve}
                isWinner={result ? result === "no" : undefined}
                subValue={noSubValueView}
                color={appConfig.NO_COLOR}
                onAction={tradeIsActive ? (action) => setVisibleTradeModal({ type: "no", action }) : undefined}
                toWinValue={
                  showNoToWin ? (
                    <span>
                      {noToWinPrice} <small>{reserve_symbol}</small>
                    </span>
                  ) : null
                }
                toWinSubValue={showNoToWin && reserve_rate ? noToWinPriceInUSD : null}
                value={
                  priceOrOdds === "price" ? (
                    <span>
                      {result ? winnerPriceView : showNoToWin ? +Number(noPrice).toFixed(4) : noPrice} <small className={showNoToWin ? styles.symbolWide : ""}>{reserve_symbol}</small>
                    </span>
                  ) : noOddsView ? (
                    <span>x{result ? winnerOddsView : noOddsView}</span>
                  ) : (
                    "-"
                  )
                }
              />
            </StatsCell>

            {isCurrencyMarket && currencyCurrentValue ? (
              <StatsCell>
                <StatsCard
                  title={t("pages.market.cards.current.title", "Current value")}
                  tooltip={t("pages.market.cards.current.desc", "The latest value of the data feed {{feed_name}}", { feed_name: params.feed_name })}
                  value={+currencyCurrentValue.toFixed(9)}
                />
              </StatsCell>
            ) : null}

            <StatsCell>
              <StatsCard
                title={t("pages.market.cards.reserve.title", "Reserve")}
                subValue={reserve_rate ? viewReserveInUSD : undefined}
                tooltip={t("pages.market.cards.reserve.desc", "Total amount invested in all outcomes")}
                value={
                  <span>
                    {viewReserve} <small>{reserve_symbol}</small>
                  </span>
                }
              />
            </StatsCell>

            <StatsCell>
              <StatsCard
                title={t("pages.market.cards.expiration_time.title", "time to expiration")}
                tooltip={t("pages.market.cards.expiration_time.desc", "The period while you can make your bets, or exit them if you changed your mind")}
                value={tradeTimerExpiry ? <Countdown value={tradeTimerExpiry} daysLabel={t("common.days", "days")} /> : "-"}
                subValue={
                  <span>
                    {t("pages.market.status", "status").toUpperCase()}: <span style={{ color: tradeStatusColor, textTransform: "uppercase" }}>{tradeStatus}</span>
                  </span>
                }
              />
            </StatsCell>
          </div>
        </div>

        {dataForChart.length > 0 && (
          <div>
            <div className={styles.typeChartSelectorWrap}>
              <Tabs value={chartType} onValueChange={(v) => setChartType(v as ChartType)} className={styles.typeChartSelector}>
                <TabsList>
                  <TabsTrigger value="prices">{t("pages.market.chart.prices", "Prices")}</TabsTrigger>
                  <TabsTrigger value="supplies">{t("pages.market.chart.supplies", "Supplies")}</TabsTrigger>
                  <TabsTrigger value="fee">{t("pages.market.chart.fee", "Fee accumulation")}</TabsTrigger>
                  <TabsTrigger value="apy">{!result ? t("pages.market.chart.estimated_apy", "Estimated APY") : t("pages.market.chart.apy", "APY")}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Line {...chartConfig} data={dataForChart} />
            {chartType === "apy" && (
              <div className={styles.apyChartDescWrap}>
                <div>{t("pages.market.chart.liquidity_date", "Liquidity provision date")}</div>
                <div className={styles.apyChartDesc}>
                  {committed_at
                    ? t("pages.market.chart.apy_desc", "APY that would be earned if an infinitesimal amount of liquidity were added on the date on the chart and held until the outcome was published.")
                    : t("pages.market.chart.estimated_apy_desc", "Estimated APY that would be earned if an infinitesimal amount of liquidity were added on the date on the chart and held until the event date. The estimation assumes that trading activity stays the same as it has been so far.")}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 50 }}>
          <div className={cn("grid grid-cols-1 items-center justify-between gap-x-2.5", showMarketSizePie && "md:grid-cols-12")}>
            <div className={cn(showMarketSizePie && "md:col-span-6")}>
              <h2 style={{ fontSize: 28 }}>{t("pages.market.apy.title", "Make money from liquidity provision")}</h2>
              <p className="mb-4">
                {reserve !== 0 && <span>{t("pages.market.apy.every_trade", "Every trade is charged a fee which is added to this prediction market’s pool (see the fee accumulation chart above).")} </span>}
                {t("pages.market.apy.earn", "Earn a share of these fees by buying all tokens in the same proportions they are already issued. One of the tokens will win, and you’ll get a share of the trading fees collected after you invested.")}
              </p>
              <p className="mb-4">
                {t("pages.market.apy.by_buying", "By buying all tokens without changing their proportions you are not betting on any outcome but taking a market-neutral position instead and adding liquidity to this prediction market. This is safe if the current proportions reflect the true probabilities.")}
              </p>

              <div className={styles.apyWrap}>
                <div className={styles.apyPanel}>{t("pages.market.apy.block", "Liquidity provision APY since the pool was started: {{percent}}%", { percent: apyView })}</div>
                <div className={styles.apyDesc}>
                  {t("pages.market.apy.block_desc", "The APY estimation is for the first LP assuming the trading activity stays the same as it has been so far. Later LPs earn from fewer trades, and the trading activity can change in the future, so the actual APY can be significantly different.")}
                </div>
              </div>

              <AddLiquidityModal disabled={!tradeIsActive} yes_team={teams?.yes?.name} no_team={teams?.no?.name} />
            </div>

            {showMarketSizePie && (
              <div className="md:col-span-4 md:col-start-9">
                <div style={{ width: "100%" }}>
                  <MarketSizePie teams={teams} reserve_decimals={reserve_decimals} stateVars={stateVars} reserve_symbol={reserve_symbol} allow_draw={allow_draw} oracle={params.oracle} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 style={{ marginBottom: 15, marginTop: 50, fontSize: 28 }}>{t("pages.market.recent_events", "Recent events")}</h2>
          <RecentEvents />
        </div>
      </div>
    </>
  );
};
