import { Fragment, memo, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { TinyLine, type TinyLineConfig } from "@ant-design/plots";
import useResizeObserver from "@react-hook/resize-observer";
import { Link } from "react-router-dom";
import moment from "moment";
import { useSelector } from "react-redux";
import { kebabCase, min } from "lodash";
import { Img } from "react-image";
import { Trans, useTranslation } from "react-i18next";
import { cn } from "cn";

import { selectLanguage, selectPriceOrOdds, selectReservesRate } from "store/slices/settingsSlice";

import { CreateNowModal } from "modals";
import { generateTextEvent } from "utils";
import { useWindowSize } from "hooks";

import i18n from "locale";
import appConfig from "appConfig";

import styles from "./PredictionItem.module.css";

const max_display_decimals = 5;

type Candle = { price: number };

export type PredictionItemProps = {
  reserve_asset?: string;
  aa_address?: string;
  reserve?: number;
  reserve_decimals?: number;
  yes_price?: number;
  no_price?: number;
  draw_price?: number;
  allow_draw?: boolean | number;
  event_date: number;
  candles?: Candle[] | number[];
  reserve_symbol?: string;
  yes_symbol?: string;
  result?: "yes" | "no" | "draw" | null;
  waiting_period_length?: number;
  feed_name?: string;
  expect_datafeed_value?: string | number;
  datafeed_value?: string | number;
  oracle?: string;
  comparison?: string;
  yes_team_id?: number | string;
  no_team_id?: number | string;
  yes_team?: string;
  no_team?: string;
  supply_yes?: number;
  supply_no?: number;
  supply_draw?: number;
  preview?: boolean;
  apy?: number;
  quiet_period?: number;
  yes_crest_url?: string | null;
  no_crest_url?: string | null;
  league?: string;
  coef?: number;
  particle?: string;
  type?: string;
};

const Ribbon = ({ color, children, text }: { color: string; children: ReactNode; text: ReactNode }) => (
  <div className="relative">
    {children}
    <div
      className="absolute -top-[5px] left-[-8px] z-10 rounded-sm px-2 py-0.5 text-xs leading-5 whitespace-nowrap text-white shadow"
      style={{ backgroundColor: color }}
    >
      {text}
    </div>
  </div>
);

const WinnerIcon = () => <img src="/winner-icon-stroke.svg" style={{ width: 32 }} alt="" />;

const Crest = ({ src, alt, winner }: { src: string | null; alt?: string; winner: boolean }) => (
  <Img
    src={src ?? ""}
    className={styles.crests}
    unloader={<img className={styles.crests} alt={alt} src="/plug.svg" />}
    container={(children) => (
      <div className="relative flex items-center justify-center">
        {children}
        {winner && (
          <div className="absolute" style={{ right: "calc(50% - 40px)", bottom: -10 }}>
            <WinnerIcon />
          </div>
        )}
      </div>
    )}
  />
);

const interpolate = (values: Record<string, unknown>) => values as unknown as string;

export const PredictionItem = memo(
  ({
    reserve_asset = "base",
    aa_address,
    reserve = 0,
    reserve_decimals = 0,
    yes_price = 0,
    no_price = 0,
    draw_price = 0,
    allow_draw,
    event_date,
    candles,
    reserve_symbol,
    yes_symbol,
    result,
    waiting_period_length = 0,
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
    preview,
    apy = 0,
    quiet_period = 0,
    yes_crest_url = null,
    no_crest_url = null,
    league,
    coef = 0,
  }: PredictionItemProps) => {
    const infoWrapRef = useRef<HTMLDivElement>(null);
    const [width] = useWindowSize();
    const { t } = useTranslation();

    const [infoHeight, setInfoHeight] = useState<number>();

    const reservesRates = useSelector(selectReservesRate);
    const priceOrOdds = useSelector(selectPriceOrOdds);
    const lang = useSelector(selectLanguage);

    useResizeObserver(infoWrapRef as RefObject<HTMLElement>, (entry) => {
      setInfoHeight((entry.target as HTMLElement).clientHeight);
    });

    const now = moment.utc().unix();
    const isExpiry = now > event_date;
    const exists = !!aa_address || preview;
    const currentReserveRate = reservesRates[reserve_asset] || 0;

    const { dataForChart, minValue } = useMemo(() => {
      const prices: number[] = preview
        ? ((candles as number[] | undefined) ?? [])
        : (candles ? (candles.length === 1 ? [...(candles as Candle[]), ...(candles as Candle[])] : (candles as Candle[])) : []).map(({ price }) => price);
      const minValue = min(prices) ?? 0;
      return { dataForChart: prices.map((value) => value - minValue), minValue };
    }, [candles, preview]);

    const config = useMemo(
      () =>
        ({
          autoFit: true,
          smooth: true,
          renderer: "svg",
          animation: false,
          theme: { background: "transparent" },
          meta: { nice: true },
          color: "#2D72F6",
          tooltip: {
            customContent: (_: string, data: { value: number }[]) => {
              if (data && data[0]) {
                const { value } = data[0];
                const tokenView = yes_team || yes_symbol || t("common.type_token", "{{type}} token", { type: t("common.yes", "yes").toUpperCase() });
                const valueView = +Number(+value + minValue).toFixed(max_display_decimals);

                return (
                  <Trans i18nKey="prediction_item.chart_tooltip">
                    {interpolate({ token: tokenView })} price - {interpolate({ value: valueView })} {interpolate({ symbol: reserve_symbol })}
                  </Trans>
                );
              }
              return null;
            },
          },
        }) as unknown as TinyLineConfig,
      [minValue, yes_team, yes_symbol, reserve_symbol, t]
    );

    // views
    const reserveView = +Number(reserve / 10 ** reserve_decimals).toPrecision(max_display_decimals);
    const yesPriceView = +Number(yes_price).toPrecision(max_display_decimals);
    const noPriceView = +Number(no_price).toPrecision(max_display_decimals);
    const drawPriceView = +Number(draw_price).toPrecision(max_display_decimals);
    const apyView = apy
      ? apy < 1000
        ? t("prediction_item.lp_apy", `Liquidity provider APY: {{apy}}%`, { apy: `${Number(apy).toFixed(2)}` })
        : t("prediction_item.apy_not_shown", "APY not shown")
      : t("prediction_item.apy_not_available", "APY not available yet");

    const eventView = generateTextEvent({
      event_date,
      feed_name,
      datafeed_value: expect_datafeed_value || datafeed_value,
      oracle,
      comparison,
      yes_team_name: undefined,
      no_team_name: undefined,
    });

    const eventViewUTC = generateTextEvent({
      event_date,
      feed_name,
      datafeed_value: expect_datafeed_value || datafeed_value,
      oracle,
      comparison,
      isUTC: true,
      yes_team_name: yes_team,
      no_team_name: no_team,
    });

    let status = "";
    let color = "red";

    if (isExpiry) {
      if (result) {
        status = t("common.status.claiming", "Claiming profit");
        color = appConfig.YES_COLOR;
      } else {
        if (now > event_date + waiting_period_length) {
          status = t("common.status.resumed", "Resumed trading");
        } else {
          status = t("common.status.waiting", "Waiting for results");
          color = "#e58e26";
        }
      }
    }

    const showRibbon = isExpiry && !!aa_address;

    const isSportMarket = !!appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === oracle);
    const marketHasCrests = isSportMarket ? yes_team_id !== undefined && no_team_id !== undefined : false;

    const seoText = kebabCase(eventViewUTC);
    const langPath = !lang || lang === "en" ? "" : `/${lang}`;
    const marketLink = `${langPath}/market/${seoText}-${aa_address}`;

    // calc odds
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

    let yesValue: string | null = null;
    let noValue: string | null = null;
    let drawValue: string | null = null;

    let yesSubValue: string | null = null;
    let noSubValue: string | null = null;
    let drawSubValue: string | null = null;

    if (reserve === 0 && !result && priceOrOdds !== "price") {
      if (!isSportMarket) {
        yesValue = "-";
        noValue = "-";

        if (allow_draw) {
          drawValue = "-";
        }
      }
    } else if (!result) {
      const anySupply = supply_yes + supply_no;

      if (supply_yes || (priceOrOdds === "price" && anySupply)) {
        yesValue = priceOrOdds === "price" ? `${yesPriceView || 0} ${reserve_symbol}` : `x${yesOddsView}`;
      } else if (!isSportMarket || (isSportMarket && supply_no)) {
        yesValue = "-";
      }

      if (supply_no || (priceOrOdds === "price" && anySupply)) {
        noValue = priceOrOdds === "price" ? `${noPriceView || 0} ${reserve_symbol}` : `x${noOddsView}`;
      } else if (!isSportMarket || (isSportMarket && supply_yes)) {
        noValue = "-";
      }

      if (allow_draw) {
        if (supply_draw || (priceOrOdds === "price" && anySupply)) {
          drawValue = priceOrOdds === "price" ? `${drawPriceView || 0} ${reserve_symbol}` : `x${drawOddsView}`;
        } else if (!isSportMarket || anySupply) {
          drawValue = "-";
        }
      }

      if (priceOrOdds === "price" && currentReserveRate && !isSportMarket) {
        yesSubValue = `$${+Number(yes_price * currentReserveRate).toFixed(2)}`;
        noSubValue = `$${+Number(no_price * currentReserveRate).toFixed(2)}`;

        if (allow_draw) {
          drawSubValue = `$${+Number(draw_price * currentReserveRate).toFixed(2)}`;
        }
      }
    } else if (result) {
      yesValue = t("common.loser", "LOSER");
      noValue = t("common.loser", "LOSER");

      if (allow_draw) {
        drawValue = t("common.loser", "LOSER");
      }

      if (result === "yes") {
        yesValue = supply_yes ? (priceOrOdds === "price" ? `${winnerPriceView} ${reserve_symbol}` : `x${winnerOddsView}`) : t("common.winner", "WINNER");
      } else if (result === "no") {
        noValue = supply_no ? (priceOrOdds === "price" ? `${winnerPriceView} ${reserve_symbol}` : `x${winnerOddsView}`) : t("common.winner", "WINNER");
      } else if (result === "draw" && allow_draw) {
        drawValue = supply_draw ? (priceOrOdds === "price" ? `${winnerPriceView} ${reserve_symbol}` : `x${winnerOddsView}`) : t("common.winner", "WINNER");
      }
    }

    const priceOrOddsView = priceOrOdds === "odds" ? t("common.odds", "odds") : t("common.price", "price");
    const drawRowVisible = !!(exists && allow_draw && (drawOddsView || result) && width >= 576);

    const card = (
      <div className={styles.itemWrap} style={{ opacity: isExpiry ? 0.5 : 1 }}>
        <div className={cn(styles.cardBody, "grid grid-cols-12 items-center gap-x-2.5")}>
          <div className="col-span-12 md:col-span-8" ref={infoWrapRef}>
            {!marketHasCrests ? (
              <div className={styles.eventDesc}>{eventView}</div>
            ) : (
              <div style={{ marginTop: 5 }}>
                <div className={cn("grid grid-cols-3 gap-x-2", drawRowVisible ? "items-end" : "items-center")}>
                  <div className="text-center">
                    <Crest src={yes_crest_url} alt={yes_team} winner={result === "yes"} />
                    <div className={styles.teamWrap}>
                      <span style={{ color: appConfig.YES_COLOR }} className={cn(styles.team, "block truncate")}>
                        <small>{yes_team}</small>
                      </span>
                    </div>

                    {exists && yesValue && noValue ? (
                      <div style={{ color: appConfig.YES_COLOR }}>
                        <span className={styles.price}>{yesValue}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className={cn("text-center", styles.draw)}>
                    <b style={{ fontSize: lang === "ru" || lang === "uk" ? 14 : 24 }}>{t("common.vs", "VS")}</b>
                    <div className={styles.time}>
                      <small>{moment.unix(event_date).format(i18n.language === "en" ? "MMM DD, LT" : i18n.language === "zh" ? "MMM Do LT" : "D MMM LT")}</small>
                    </div>
                    {drawRowVisible ? (
                      <div style={{ color: appConfig.DRAW_COLOR }}>
                        <div className={styles.team}>
                          <small>{t("common.draw", "draw")}</small>
                        </div>
                        <div style={{ color: appConfig.DRAW_COLOR }}>
                          <span className={styles.price}>{drawValue}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="text-center">
                    <Crest src={no_crest_url} alt={no_team} winner={result === "no"} />

                    <div className={styles.teamWrap}>
                      <span style={{ color: appConfig.NO_COLOR }} className={cn(styles.team, "block truncate")}>
                        <small>{no_team}</small>
                      </span>
                    </div>

                    {exists && noValue && yesValue ? (
                      <div style={{ color: appConfig.NO_COLOR }}>
                        <span className={styles.price}>{noValue}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
            {exists && !isSportMarket ? (
              <div className={cn(styles.infoWrap, "grid grid-cols-2 gap-x-2.5 md:grid-cols-4")}>
                <div>
                  <div className={styles.infoTitle}>{t("pages.market.cards.reserve.title", "Reserve")}</div>
                  <div>
                    {reserveView} <small>{reserve_symbol}</small>
                  </div>
                  {priceOrOdds === "price" && currentReserveRate && !result ? <div className={styles.infoValueInDollar}>${+Number(reserveView * currentReserveRate).toFixed(2)}</div> : null}
                </div>
                <div style={{ color: appConfig.YES_COLOR }}>
                  <div className={styles.infoTitle}>
                    {t("common.yes", "yes")} {priceOrOddsView}
                  </div>
                  <div style={{ fontSize: 13 }}>{yesValue}</div>
                  {yesSubValue ? <div className={styles.infoValueInDollar}>{yesSubValue}</div> : null}
                </div>
                <div style={{ color: appConfig.NO_COLOR }}>
                  <div className={styles.infoTitle}>
                    {t("common.no", "no")} {priceOrOddsView}
                  </div>
                  <div style={{ fontSize: 13 }}>{noValue}</div>
                  {noSubValue ? <div className={styles.infoValueInDollar}>{noSubValue}</div> : null}
                </div>
                <div>
                  {allow_draw ? (
                    <div>
                      <div className={styles.infoTitle}>
                        {t("common.draw", "draw")} {priceOrOddsView}
                      </div>
                      <div style={{ color: appConfig.DRAW_COLOR }}>
                        <div style={{ fontSize: 13 }}>{drawValue}</div>
                        {drawSubValue ? <div className={styles.infoValueInDollar}>{drawSubValue}</div> : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
          {width >= 768 && aa_address ? <div className={styles.apyWrap}>{apyView}</div> : null}
          {exists || preview ? (
            infoHeight && dataForChart.length > 0 ? (
              <div className="col-span-12 flex items-center md:col-span-4">
                {width >= 768 ? (
                  <div style={{ height: infoHeight - 20, marginTop: 10, width: "100%", boxSizing: "border-box" }}>
                    <TinyLine {...config} data={dataForChart} />
                  </div>
                ) : null}
              </div>
            ) : null
          ) : (
            <div className="col-span-12 md:col-span-4">
              <div className={styles.createNowWrap}>
                <CreateNowModal
                  feed_name={feed_name}
                  oracle={oracle}
                  event_date={event_date}
                  event={eventView}
                  expect_datafeed_value={expect_datafeed_value}
                  waiting_period_length={waiting_period_length}
                  no_team={no_team}
                  yes_team={yes_team}
                  quiet_period={quiet_period}
                  comparison={comparison}
                  yes_crest_url={yes_crest_url}
                  no_crest_url={no_crest_url}
                  league={league}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );

    const linked = exists && !preview ? <Link to={marketLink}>{card}</Link> : <Fragment>{card}</Fragment>;

    return showRibbon ? (
      <Ribbon color={color} text={<div style={{ fontSize: 12 }}>{status}</div>}>
        {linked}
      </Ribbon>
    ) : (
      linked
    );
  }
);

PredictionItem.displayName = "PredictionItem";
