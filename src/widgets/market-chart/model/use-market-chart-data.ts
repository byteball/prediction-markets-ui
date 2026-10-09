import { useMemo } from "react";
import moment from "moment";

import i18n from "@/shared/i18n";
import { BASE_AAS } from "@/shared/config/env";
import { useAppSelector } from "@/shared/lib/redux";
import { selectActiveAddress, selectActiveDailyCandles, selectActiveMarketParams, selectActiveMarketStateVars, selectActiveTeams } from "@/entities/market";
import { selectReservesRate } from "@/entities/reserve-asset";

import type { ChartPoint, ChartType } from "../lib/chart-config";

const SECONDS_IN_YEAR = 31_536_000;
const HOUR = 3600;
const DAY = 24 * HOUR;

/** Points of the market history chart (prices, supplies, fee accumulation or APY) built from the daily candles. */
export const useMarketChartData = (chartType: ChartType, now: number): ChartPoint[] => {
  const candles = useAppSelector(selectActiveDailyCandles);
  const address = useAppSelector(selectActiveAddress);
  const params = useAppSelector(selectActiveMarketParams);
  const { coef = 1, result } = useAppSelector(selectActiveMarketStateVars);
  const teams = useAppSelector(selectActiveTeams);
  const reservesRate = useAppSelector(selectReservesRate);

  const { allow_draw, reserve_symbol, yes_decimals, no_decimals, draw_decimals, yes_symbol, no_symbol, draw_symbol, event_date, created_at, committed_at, base_aa, issue_fee, first_trade_ts, waiting_period_length } = params;
  const sevenDaysAlreadyPassed = now > event_date + 7 * DAY;

  return useMemo<ChartPoint[]>(() => {
    let candlesData = candles;
    const data: ChartPoint[] = [];

    if (candlesData.length === 1 && chartType !== "apy") {
      candlesData = [candles[0], { ...candlesData[0], start_timestamp: candlesData[0].start_timestamp - HOUR }];
    }

    if (candlesData.length > 0 && chartType === "fee") {
      data.push({ date: moment.unix(created_at).format(sevenDaysAlreadyPassed ? "ll" : "lll"), value: 0, chartType });
    }

    const last_close_ts = committed_at ? committed_at : candlesData[candlesData.length - 1]?.start_timestamp;
    const needsIssueFeeForLiquidity = (BASE_AAS ?? []).findIndex((aa) => aa === base_aa) === 0;
    const first_trade_at = first_trade_ts || created_at;

    let coef_end: number;

    if (result || (event_date + waiting_period_length > now && event_date <= now)) {
      coef_end = coef * (1 - (needsIssueFeeForLiquidity ? issue_fee : 0));
    } else {
      coef_end = (coef * (1 - (needsIssueFeeForLiquidity ? issue_fee : 0))) ** (((committed_at || event_date) - first_trade_at) / (last_close_ts - first_trade_at));
    }

    const yesLabel = teams?.yes?.name || i18n.t("common.yes", "yes").toUpperCase();
    const noLabel = teams?.no?.name || i18n.t("common.no", "no").toUpperCase();
    const drawLabel = i18n.t("common.draw", "draw").toUpperCase();

    candlesData.forEach(({ start_timestamp: open_ts, open_yes_price: yes_price, open_no_price: no_price, open_draw_price: draw_price, open_supply_yes: supply_yes, open_supply_no: supply_no, open_supply_draw: supply_draw, open_coef }) => {
      const date = moment.unix(open_ts).format((committed_at || now) > (first_trade_ts || created_at) + 30 * DAY ? "ll" : "lll");

      if (chartType === "prices") {
        data.push(
          { date, value: yes_price, type: yesLabel, currencySymbol: reserve_symbol, chartType, symbol: yes_symbol },
          { date, value: no_price, type: noLabel, currencySymbol: reserve_symbol, chartType, symbol: no_symbol }
        );

        if (allow_draw) {
          data.push({ date, value: draw_price, type: drawLabel, currencySymbol: reserve_symbol, chartType, symbol: draw_symbol });
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
          { date, value: +Number(supply_yes / 10 ** yes_decimals).toFixed(yes_decimals), type: yesLabel, currencySymbol: yes_symbol, chartType },
          { date, value: +Number(supply_no / 10 ** no_decimals).toFixed(no_decimals), type: noLabel, currencySymbol: no_symbol, chartType }
        );

        if (allow_draw) {
          data.push({ date, value: +Number(supply_draw / 10 ** draw_decimals).toFixed(draw_decimals), type: drawLabel, currencySymbol: draw_symbol, chartType });
        }
      }
    });

    return data;
  }, [candles, chartType, address, reservesRate, teams, i18n.language]);
};
