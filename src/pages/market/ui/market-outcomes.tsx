import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useAppSelector } from "@/shared/lib/redux";
import { DRAW_COLOR, NO_COLOR, WARNING_COLOR, YES_COLOR } from "@/shared/config/colors";
import { Countdown } from "@/shared/ui/countdown";
import {
  getMarketPriceByType,
  OutcomeCard,
  selectActiveCurrencyCurrentValue,
  selectActiveMarketParams,
  selectActiveMarketStateVars,
  selectActiveTeams,
  selectPriceOrOdds,
  type MarketPhaseView,
  type OutcomeType,
} from "@/entities/market";
import { isSportOracle } from "@/entities/oracle";
import { selectReservesRate } from "@/entities/reserve-asset";
import { useTradeDialog } from "@/features/trade";

import styles from "./market-page.module.css";

type MarketOutcomesProps = {
  phase: MarketPhaseView;
  isCurrencyMarket: boolean;
};

const Cell = ({ children }: { children: ReactNode }) => <div style={{ marginBottom: 30 }}>{children}</div>;

/** Outcome cards (YES / NO / DRAW) with the current value, reserve and expiration cards of the opened market. */
export const MarketOutcomes = ({ phase, isCurrencyMarket }: MarketOutcomesProps) => {
  const { t } = useTranslation();
  const { open: openTradeDialog } = useTradeDialog();

  const params = useAppSelector(selectActiveMarketParams);
  const stateVars = useAppSelector(selectActiveMarketStateVars);
  const teams = useAppSelector(selectActiveTeams);
  const priceOrOdds = useAppSelector(selectPriceOrOdds);
  const reservesRate = useAppSelector(selectReservesRate);
  const currencyCurrentValue = useAppSelector(selectActiveCurrencyCurrentValue);

  const { reserve_asset = "base", allow_draw, reserve_symbol, reserve_decimals, yes_odds = null, no_odds = null, draw_odds = null } = params;
  const { reserve = 0, result, supply_yes = 0, supply_no = 0, supply_draw = 0, coef = 1 } = stateVars;
  const reserve_rate = reservesRate[reserve_asset] || 0;

  const viewReserve = +Number(reserve / 10 ** reserve_decimals).toPrecision(5);
  const viewReserveInUSD = "$" + +Number((reserve / 10 ** reserve_decimals) * reserve_rate).toPrecision(2);

  const prices = {
    yes: +getMarketPriceByType(stateVars, "yes").toFixed(reserve_decimals),
    no: +getMarketPriceByType(stateVars, "no").toFixed(reserve_decimals),
    draw: +getMarketPriceByType(stateVars, "draw").toFixed(reserve_decimals),
  };
  const supplies = { yes: supply_yes, no: supply_no, draw: supply_draw };
  const bookmakerOdds = { yes: yes_odds, no: no_odds, draw: draw_odds };

  const oddsOf = (type: OutcomeType): number | null => (reserve !== 0 && supplies[type] !== 0 ? +Number(reserve / supplies[type] / prices[type]).toFixed(5) : reserve !== 0 ? null : 0);
  const odds = { yes: oddsOf("yes"), no: oddsOf("no"), draw: oddsOf("draw") };

  const isSportMarket = isSportOracle(params.oracle);
  const haveTeamNames = isSportMarket && teams?.yes?.name && teams?.no?.name;

  let winnerPriceView = 0;
  let winnerOddsView = 0;

  if (result && reserve) {
    const winnerSupply = supplies[result];

    if (winnerSupply) {
      winnerPriceView = +Number(reserve / winnerSupply).toPrecision(5);
      winnerOddsView = +Number(reserve ** 2 / (winnerSupply ** 2 * coef ** 2)).toPrecision(5);
    }
  }

  const allOddsKnown = yes_odds && no_odds && draw_odds && odds.yes && odds.no && odds.draw;

  const tooltipOf = (type: OutcomeType): string => {
    const label = type === "yes" ? "Yes" : type === "no" ? "No" : "Draw";

    if (haveTeamNames) {
      const team_name = type === "yes" ? teams.yes!.name : teams.no!.name;

      if (priceOrOdds === "price") {
        return type === "draw"
          ? t("pages.market.sport_price_tooltip_draw", "The price of the draw token. In case of a draw, all funds paid by buyers of all tokens will be divided among draw token holders.")
          : t("pages.market.sport_price_tooltip", "The price of the {{team_name}} token. If {{team_name}} wins, all funds paid by buyers of all tokens will be divided among {{team_name}} token holders.", { team_name });
      }

      return type === "draw"
        ? t("pages.market.sport_odds_tooltip_draw", "The multiple you receive if you bet on draw and your bet wins, assuming the odds don’t change.")
        : t("pages.market.sport_odds_tooltip", "The multiple you receive if you bet on {{team_name}} and it wins, assuming the odds don’t change.", { team_name });
    }

    return priceOrOdds === "price"
      ? t("pages.market.price_tooltip", "The price of the token that represents the “{{type}}” outcome. If this outcome wins, all funds paid by buyers of all tokens will be divided among “{{type}}” token holders.", { type: label })
      : t("pages.market.odds_tooltip", "The multiple you receive if you bet on “{{type}}” outcome and it wins, assuming the odds don’t change.", { type: label });
  };

  const subValueOf = (type: OutcomeType): string => {
    if (priceOrOdds === "price" && reserve_rate) {
      return type === "draw" && !allow_draw ? "" : `$${+Number(prices[type] * reserve_rate).toPrecision(4)}`;
    }

    if (priceOrOdds === "odds" && allOddsKnown) {
      return t("pages.market.bookmaker_odds", `Bookmaker odds: x{{odds}}`, { odds: bookmakerOdds[type] });
    }

    return "";
  };

  const renderOutcome = (type: OutcomeType, title: string, color: string) => {
    const supply = supplies[type];
    const price = prices[type];
    const toWinPrice = supply ? +Number(reserve / supply).toFixed(4) : 0;
    const toWinPriceInUSD = reserve_rate ? `$${+Number(toWinPrice * reserve_rate).toFixed(4)}` : "";
    const showToWin = !result && priceOrOdds === "price" && reserve && supply;

    return (
      <Cell>
        <OutcomeCard
          title={title}
          tooltip={tooltipOf(type)}
          reserve={reserve}
          isWinner={result ? result === type : undefined}
          subValue={subValueOf(type)}
          color={color}
          onAction={phase.isTradeActive ? (action) => openTradeDialog({ type, action }) : undefined}
          toWinValue={
            showToWin ? (
              <span>
                {toWinPrice} <small>{reserve_symbol}</small>
              </span>
            ) : null
          }
          toWinSubValue={showToWin && reserve_rate ? toWinPriceInUSD : null}
          value={
            priceOrOdds === "price" ? (
              <span>
                {result ? winnerPriceView : showToWin ? +Number(price).toFixed(4) : price} <small className={showToWin ? styles.symbolWide : ""}>{reserve_symbol}</small>
              </span>
            ) : odds[type] ? (
              <span>x{result ? winnerOddsView : odds[type]}</span>
            ) : (
              "-"
            )
          }
        />
      </Cell>
    );
  };

  const phaseLabel = (
    phase.phase === "trading"
      ? t("common.status.trading", "trading")
      : phase.phase === "quiet_period"
        ? t("common.status.quiet_period", "quiet period")
        : phase.phase === "claiming"
          ? t("common.status.claiming", "Claiming profit")
          : phase.phase === "waiting"
            ? t("common.status.waiting", "Waiting for results")
            : t("common.status.resumed", "Resumed trading")
  ).toUpperCase();
  const phaseColor = phase.phase === "quiet_period" || phase.phase === "waiting" ? WARNING_COLOR : YES_COLOR;

  return (
    <div className={styles.infoWrap}>
      <div className="grid grid-cols-1 gap-x-[30px] md:grid-cols-2 lg:grid-cols-3">
        {renderOutcome("yes", `${haveTeamNames ? teams.yes!.name : t("common.yes", "yes")}`, YES_COLOR)}
        {allow_draw ? renderOutcome("draw", t("common.draw", "draw"), DRAW_COLOR) : null}
        {renderOutcome("no", `${haveTeamNames ? teams.no!.name : t("common.no", "no")}`, NO_COLOR)}

        {isCurrencyMarket && currencyCurrentValue ? (
          <Cell>
            <OutcomeCard
              title={t("pages.market.cards.current.title", "Current value")}
              tooltip={t("pages.market.cards.current.desc", "The latest value of the data feed {{feed_name}}", { feed_name: params.feed_name })}
              value={+currencyCurrentValue.toFixed(9)}
            />
          </Cell>
        ) : null}

        <Cell>
          <OutcomeCard
            title={t("pages.market.cards.reserve.title", "Reserve")}
            subValue={reserve_rate ? viewReserveInUSD : undefined}
            tooltip={t("pages.market.cards.reserve.desc", "Total amount invested in all outcomes")}
            value={
              <span>
                {viewReserve} <small>{reserve_symbol}</small>
              </span>
            }
          />
        </Cell>

        <Cell>
          <OutcomeCard
            title={t("pages.market.cards.expiration_time.title", "time to expiration")}
            tooltip={t("pages.market.cards.expiration_time.desc", "The period while you can make your bets, or exit them if you changed your mind")}
            value={phase.timerExpiry ? <Countdown value={phase.timerExpiry} daysLabel={t("common.days", "days")} /> : "-"}
            subValue={
              <span>
                {t("pages.market.status", "status").toUpperCase()}: <span style={{ color: phaseColor, textTransform: "uppercase" }}>{phaseLabel}</span>
              </span>
            }
          />
        </Cell>
      </div>
    </div>
  );
};
