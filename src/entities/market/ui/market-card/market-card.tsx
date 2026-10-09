import { Fragment, memo, useRef, useState, type ReactNode, type RefObject } from "react";
import useResizeObserver from "@react-hook/resize-observer";
import { Link } from "react-router-dom";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { cn } from "cn";

import { useAppSelector } from "@/shared/lib/redux";
import { selectLanguage } from "@/shared/i18n/model";
import { useWindowSize } from "@/shared/lib/hooks/use-window-size";
import { WARNING_COLOR, YES_COLOR } from "@/shared/config/colors";
import { selectReservesRate } from "@/entities/reserve-asset/@x/market";

import type { CalendarItem, MarketListItem } from "../../model/types";
import { selectPriceOrOdds } from "../../model/market-view-slice";
import { getMarketCardView } from "../../lib/get-market-card-view";
import { MarketCardInfo } from "./market-card-info";
import { MarketCardSparkline } from "./market-card-sparkline";
import { MarketCardTeams } from "./market-card-teams";
import styles from "./market-card.module.css";

export type MarketCardProps = {
  market: MarketListItem | CalendarItem;
  /** Preview inside the create form: not linked, sparkline from `previewValues`. */
  preview?: boolean;
  previewValues?: number[];
  /** Rendered in place of the sparkline for a calendar entry without a market (e.g. a "create now" action). */
  actionSlot?: ReactNode;
};

const Ribbon = ({ color, children, text }: { color: string; children: ReactNode; text: ReactNode }) => (
  <div className="relative">
    {children}
    <div className="absolute -top-[5px] left-[-8px] z-10 rounded-sm px-2 py-0.5 text-xs leading-5 whitespace-nowrap text-white shadow" style={{ backgroundColor: color }}>
      {text}
    </div>
  </div>
);

const PHASE_COLORS = { claiming: YES_COLOR, waiting: WARNING_COLOR, resumed: "red" } as const;

/** A market (or an upcoming event) in the lists of the main page. */
export const MarketCard = memo(({ market, preview = false, previewValues, actionSlot }: MarketCardProps) => {
  const infoWrapRef = useRef<HTMLDivElement>(null);
  const [width] = useWindowSize();
  const { t } = useTranslation();
  const [infoHeight, setInfoHeight] = useState<number>();

  const reservesRates = useAppSelector(selectReservesRate);
  const priceOrOdds = useAppSelector(selectPriceOrOdds);
  const lang = useAppSelector(selectLanguage);

  useResizeObserver(infoWrapRef as RefObject<HTMLElement>, (entry) => {
    setInfoHeight((entry.target as HTMLElement).clientHeight);
  });

  const { reserve_asset = "base", aa_address, allow_draw, result, reserve_symbol, yes_team, candles } = market;
  const reserveRate = reservesRates[reserve_asset] || 0;

  const view = getMarketCardView({ market, preview, priceOrOdds, reserveRate, lang, now: moment.utc().unix(), t });
  const { exists, isExpiry, isSportMarket, marketHasCrests, phase, yes, no, draw } = view;

  const phaseLabel = phase === "claiming" ? t("common.status.claiming", "Claiming profit") : phase === "resumed" ? t("common.status.resumed", "Resumed trading") : t("common.status.waiting", "Waiting for results");
  const showRibbon = isExpiry && !!aa_address && !!phase;
  const drawRowVisible = !!(exists && allow_draw && (view.drawOddsView || result) && width >= 576);
  const reserveInUsd = priceOrOdds === "price" && reserveRate && !result ? +Number(view.reserveView * reserveRate).toFixed(2) : null;

  const card = (
    <div className={styles.itemWrap} style={{ opacity: isExpiry ? 0.5 : 1 }}>
      <div className={cn(styles.cardBody, "grid grid-cols-12 items-center gap-x-2.5")}>
        <div className="col-span-12 md:col-span-8" ref={infoWrapRef}>
          {!marketHasCrests ? (
            <div className={styles.eventDesc}>{view.eventView}</div>
          ) : (
            <MarketCardTeams {...market} yes={yes} no={no} draw={draw} exists={exists} drawRowVisible={drawRowVisible} lang={lang} />
          )}
          {exists && !isSportMarket ? (
            <MarketCardInfo reserveView={view.reserveView} reserveSymbol={reserve_symbol} reserveInUsd={reserveInUsd} allowDraw={allow_draw} priceOrOddsView={view.priceOrOddsView} yes={yes} no={no} draw={draw} />
          ) : null}
        </div>
        {width >= 768 && aa_address ? <div className={styles.apyWrap}>{view.apyView}</div> : null}
        {exists ? (
          infoHeight && width >= 768 ? (
            <div className="col-span-12 flex items-center md:col-span-4">
              <MarketCardSparkline candles={candles} previewValues={preview ? (previewValues ?? []) : undefined} height={infoHeight - 20} yesLabel={yes_team || view.yesSymbol} reserveSymbol={reserve_symbol} />
            </div>
          ) : null
        ) : actionSlot ? (
          <div className="col-span-12 md:col-span-4">
            <div className={styles.createNowWrap}>{actionSlot}</div>
          </div>
        ) : null}
      </div>
    </div>
  );

  const linked = exists && !preview ? <Link to={view.marketLink}>{card}</Link> : <Fragment>{card}</Fragment>;

  return showRibbon && phase ? (
    <Ribbon color={PHASE_COLORS[phase]} text={<div style={{ fontSize: 12 }}>{phaseLabel}</div>}>
      {linked}
    </Ribbon>
  ) : (
    linked
  );
});

MarketCard.displayName = "MarketCard";
