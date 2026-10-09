import { kebabCase } from "lodash-es";
import type { TFunction } from "i18next";

import { getLangPath } from "@/shared/lib/lang-path";
import { isSportOracle } from "@/entities/oracle/@x/market";

import type { MarketListItem } from "../model/types";
import type { PriceOrOdds } from "../model/market-view-slice";
import { generateTextEvent } from "./generate-text-event";
import type { MarketPhase } from "./get-market-phase";
import { getTokenlessSymbols } from "./get-tokenless-symbols";

export const MAX_DISPLAY_DECIMALS = 5;

export type MarketCardViewInput = {
  market: MarketListItem;
  preview: boolean;
  priceOrOdds: PriceOrOdds;
  /** USD rate of the reserve asset, 0 when unknown. */
  reserveRate: number;
  lang: string | null;
  now: number;
  t: TFunction;
};

export type OutcomeView = { value: string | null; subValue: string | null };

export type MarketCardView = {
  /** The market exists on chain (or is a preview); calendar entries without a market are not. */
  exists: boolean;
  isExpiry: boolean;
  isSportMarket: boolean;
  marketHasCrests: boolean;
  /** Phase after the event; undefined while trading. */
  phase?: Exclude<MarketPhase, "trading" | "quiet_period">;
  yesSymbol?: string;
  reserveView: number;
  apyView: string;
  eventView: string;
  marketLink: string;
  yes: OutcomeView;
  no: OutcomeView;
  draw: OutcomeView;
  drawOddsView: number;
  priceOrOddsView: string;
};

const toPrecision = (value: number) => +Number(value).toPrecision(MAX_DISPLAY_DECIMALS);

/** Everything a market card shows, derived from the listed market and the display preferences. */
export const getMarketCardView = ({ market, preview, priceOrOdds, reserveRate, lang, now, t }: MarketCardViewInput): MarketCardView => {
  const {
    aa_address,
    reserve = 0,
    reserve_decimals = 0,
    yes_price = 0,
    no_price = 0,
    draw_price = 0,
    allow_draw,
    event_date,
    reserve_symbol,
    yes_symbol,
    is_tokenless,
    result,
    waiting_period_length,
    feed_name,
    expect_datafeed_value,
    datafeed_value,
    oracle,
    comparison,
    yes_team_id,
    no_team_id,
    yes_team,
    no_team,
    supply_yes = 0,
    supply_no = 0,
    supply_draw = 0,
    apy = 0,
    coef = 0,
  } = market;

  const yesSymbol = yes_symbol || (is_tokenless && feed_name ? getTokenlessSymbols({ feed_name, event_date, oracle }).yes_symbol : undefined);
  const isExpiry = now > event_date;
  const exists = !!aa_address || preview;
  const isSportMarket = isSportOracle(oracle);
  const marketHasCrests = isSportMarket ? yes_team_id !== undefined && no_team_id !== undefined : false;

  let phase: MarketCardView["phase"];

  if (isExpiry) {
    if (result) {
      phase = "claiming";
    } else if (waiting_period_length !== undefined && now > event_date + waiting_period_length) {
      phase = "resumed";
    } else {
      phase = "waiting";
    }
  }

  const reserveView = toPrecision(reserve / 10 ** reserve_decimals);
  const yesPriceView = toPrecision(yes_price);
  const noPriceView = toPrecision(no_price);
  const drawPriceView = toPrecision(draw_price);

  const apyView = apy
    ? apy < 1000
      ? t("prediction_item.lp_apy", `Liquidity provider APY: {{apy}}%`, { apy: `${Number(apy).toFixed(2)}` })
      : t("prediction_item.apy_not_shown", "APY not shown")
    : t("prediction_item.apy_not_available", "APY not available yet");

  const eventParams = { event_date, feed_name, datafeed_value: expect_datafeed_value || datafeed_value, oracle, comparison };
  const eventView = generateTextEvent({ ...eventParams, yes_team_name: undefined, no_team_name: undefined });
  const eventViewUTC = generateTextEvent({ ...eventParams, isUTC: true, yes_team_name: yes_team, no_team_name: no_team });
  const marketLink = `${getLangPath(lang)}/market/${kebabCase(eventViewUTC)}-${aa_address}`;

  // odds
  let yesOddsView = 0;
  let drawOddsView = 0;
  let noOddsView = 0;

  if (reserve !== 0) {
    yesOddsView = supply_yes !== 0 ? +Number(reserve / supply_yes / yes_price).toFixed(5) : 0;
    noOddsView = supply_no !== 0 ? +Number(reserve / supply_no / no_price).toFixed(5) : 0;
    drawOddsView = supply_draw !== 0 ? +Number(reserve / supply_draw / draw_price).toFixed(5) : 0;
  }

  let winnerPriceView = 0;
  let winnerOddsView = 0;

  if (result && reserve) {
    const winnerSupply = result === "yes" ? supply_yes : result === "no" ? supply_no : supply_draw;

    if (winnerSupply) {
      winnerPriceView = +Number(reserve / winnerSupply).toFixed(5);
      winnerOddsView = +Number(reserve ** 2 / (winnerSupply ** 2 * coef ** 2)).toPrecision(5);
    }
  }

  const yes: OutcomeView = { value: null, subValue: null };
  const no: OutcomeView = { value: null, subValue: null };
  const draw: OutcomeView = { value: null, subValue: null };

  if (reserve === 0 && !result && priceOrOdds !== "price") {
    if (!isSportMarket) {
      yes.value = "-";
      no.value = "-";

      if (allow_draw) {
        draw.value = "-";
      }
    }
  } else if (!result) {
    const anySupply = supply_yes + supply_no;

    if (supply_yes || (priceOrOdds === "price" && anySupply)) {
      yes.value = priceOrOdds === "price" ? `${yesPriceView || 0} ${reserve_symbol}` : `x${yesOddsView}`;
    } else if (!isSportMarket || (isSportMarket && supply_no)) {
      yes.value = "-";
    }

    if (supply_no || (priceOrOdds === "price" && anySupply)) {
      no.value = priceOrOdds === "price" ? `${noPriceView || 0} ${reserve_symbol}` : `x${noOddsView}`;
    } else if (!isSportMarket || (isSportMarket && supply_yes)) {
      no.value = "-";
    }

    if (allow_draw) {
      if (supply_draw || (priceOrOdds === "price" && anySupply)) {
        draw.value = priceOrOdds === "price" ? `${drawPriceView || 0} ${reserve_symbol}` : `x${drawOddsView}`;
      } else if (!isSportMarket || anySupply) {
        draw.value = "-";
      }
    }

    if (priceOrOdds === "price" && reserveRate && !isSportMarket) {
      yes.subValue = `$${+Number(yes_price * reserveRate).toFixed(2)}`;
      no.subValue = `$${+Number(no_price * reserveRate).toFixed(2)}`;

      if (allow_draw) {
        draw.subValue = `$${+Number(draw_price * reserveRate).toFixed(2)}`;
      }
    }
  } else {
    const loser = t("common.loser", "LOSER");
    const winner = t("common.winner", "WINNER");
    const winnerView = priceOrOdds === "price" ? `${winnerPriceView} ${reserve_symbol}` : `x${winnerOddsView}`;

    yes.value = loser;
    no.value = loser;

    if (allow_draw) {
      draw.value = loser;
    }

    if (result === "yes") {
      yes.value = supply_yes ? winnerView : winner;
    } else if (result === "no") {
      no.value = supply_no ? winnerView : winner;
    } else if (result === "draw" && allow_draw) {
      draw.value = supply_draw ? winnerView : winner;
    }
  }

  const priceOrOddsView = priceOrOdds === "odds" ? t("common.odds", "odds") : t("common.price", "price");

  return { exists, isExpiry, isSportMarket, marketHasCrests, phase, yesSymbol, reserveView, apyView, eventView, marketLink, yes, no, draw, drawOddsView, priceOrOddsView };
};
