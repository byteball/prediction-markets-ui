import moment from "moment";
import { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";

import { selectActiveAddress, selectActiveMarketParams, selectActiveRecentEvents, selectActiveRecentEventsCount } from "store/slices/active-slice";
import { loadMoreRecentEvents } from "store/thunks/load-more-recent-events";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { MarketParams, RecentEvent } from "store/types";

import i18n from "locale";
import appConfig from "app-config";
import { getExplorerUrl } from "utils";

import { Button } from "components/ui/button";

import styles from "./recent-events.module.css";

const limitStep = 5;


type RecentEventItemProps = Pick<RecentEvent, "type" | "trigger_unit" | "trigger_address" | "timestamp" | "reserve_amount" | "yes_amount" | "no_amount" | "draw_amount"> &
  Pick<MarketParams, "reserve_decimals" | "reserve_symbol" | "yes_symbol" | "no_symbol" | "draw_symbol" | "yes_decimals" | "no_decimals" | "draw_decimals" | "allow_draw">;

type CountProps = Pick<RecentEventItemProps, "yes_amount" | "no_amount" | "draw_amount" | "yes_symbol" | "no_symbol" | "draw_symbol"> & { yesAmount: number; noAmount: number; drawAmount: number | string };

const Count = ({ yes_amount, no_amount, draw_amount, yesAmount, noAmount, drawAmount, yes_symbol, no_symbol, draw_symbol }: CountProps) => (
  <>
    {yes_amount !== 0 ? <span style={{ color: appConfig.YES_COLOR }}>{` ${yesAmount} ${yes_symbol}`}</span> : ""}{" "}
    {no_amount !== 0 ? <span style={{ color: appConfig.NO_COLOR }}>{` ${noAmount} ${no_symbol}`}</span> : ""}
    {draw_amount !== 0 ? <span style={{ color: appConfig.DRAW_COLOR }}>{` ${drawAmount} ${draw_symbol}`}</span> : ""}
  </>
);

const RecentEventItem = ({
  type,
  trigger_unit,
  trigger_address,
  timestamp,
  reserve_amount,
  yes_amount,
  no_amount,
  draw_amount,
  reserve_decimals,
  reserve_symbol,
  yes_symbol,
  no_symbol,
  draw_symbol,
  yes_decimals,
  no_decimals,
  draw_decimals,
  allow_draw,
}: RecentEventItemProps) => {
  let Event = null;

  const reserveAmount = +Number(Math.abs(reserve_amount) / 10 ** reserve_decimals).toFixed(reserve_decimals);
  const yesAmount = +Number(Math.abs(yes_amount) / 10 ** reserve_decimals).toFixed(yes_decimals);
  const noAmount = +Number(Math.abs(no_amount) / 10 ** reserve_decimals).toFixed(no_decimals);
  const drawAmount = allow_draw ? +Number(Math.abs(draw_amount) / 10 ** reserve_decimals).toFixed(draw_decimals) : "";
  const format = ["ru", "uk"].includes(i18n.language) ? "D MMMM gggg [в] LT" : "LLL";

  const countProps = { yes_amount, no_amount, draw_amount, yesAmount, noAmount, drawAmount, yes_symbol, no_symbol, draw_symbol };

  const values = { address: trigger_address.slice(0, 16), amount: reserveAmount, symbol: reserve_symbol };

  const addressLink = (
    <a href={getExplorerUrl("address", trigger_address)} target="_blank" rel="noopener">
      {"{{address}}"}...
    </a>
  );

  if (type === "add_liquidity") {
    Event = (
      <Trans i18nKey="recent_events.add_liquidity" values={values}>
        {addressLink} sent {"{{amount}}"} {"{{symbol}}"} to add liquidity <Count {...countProps} />
      </Trans>
    );
  } else if (type === "buy_by_type") {
    Event = (
      <Trans i18nKey="recent_events.buy" values={values}>
        {addressLink} sent {"{{amount}}"} {"{{symbol}}"} to buy <Count {...countProps} />
      </Trans>
    );
  } else if (type === "redeem") {
    Event = (
      <Trans i18nKey="recent_events.redeem" values={values}>
        {addressLink} sold <Count {...countProps} /> for {"{{amount}}"} {"{{symbol}}"}
      </Trans>
    );
  } else if (type === "claim_profit") {
    Event = (
      <Trans i18nKey="recent_events.claim_profit" values={values}>
        {addressLink} profited {"{{amount}}"} {"{{symbol}}"}
      </Trans>
    );
  }

  return (
    <div className={styles.eventWrap}>
      <div>{Event}</div>
      <a href={getExplorerUrl("unit", trigger_unit)} target="_blank" rel="noopener" className={styles.timestamp}>
        {moment.unix(timestamp).format(format)}
      </a>
    </div>
  );
};

export const RecentEvents = () => {
  const { t } = useTranslation();
  const address = useAppSelector(selectActiveAddress);
  const notSortedData = useAppSelector(selectActiveRecentEvents);
  const count = useAppSelector(selectActiveRecentEventsCount);

  const dispatch = useAppDispatch();

  const { reserve_decimals, reserve_symbol, yes_symbol, no_symbol, draw_symbol, yes_decimals, no_decimals, draw_decimals, allow_draw } = useAppSelector(selectActiveMarketParams);

  const data = useMemo(() => [...notSortedData].sort((a, b) => b.timestamp - a.timestamp), [notSortedData]);

  const showMoreButton = data.length < count;
  const currentPage = Math.trunc(data.length / limitStep);

  const loadMore = () => {
    dispatch(loadMoreRecentEvents({ address, page: currentPage + 1 }));
  };

  return (
    <div className={styles.eventList}>
      {data.length === 0 ? (
        <div className="py-4 text-center text-muted-foreground">{t("recent_events.no_events", "No events")}</div>
      ) : (
        <ul className="m-0 list-none p-0">
          {data.map((item) => (
            <li key={`ev-${item.trigger_unit}-${item.timestamp}`}>
              <RecentEventItem
                {...item}
                reserve_decimals={reserve_decimals}
                reserve_symbol={reserve_symbol}
                yes_symbol={yes_symbol}
                no_symbol={no_symbol}
                draw_symbol={draw_symbol}
                yes_decimals={yes_decimals}
                no_decimals={no_decimals}
                draw_decimals={draw_decimals}
                allow_draw={allow_draw}
              />
            </li>
          ))}
        </ul>
      )}
      {showMoreButton ? (
        <div className={styles.moreButtonWrap}>
          <Button variant="outline" onClick={loadMore}>
            {t("recent_events.show_more", "Show more")}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
