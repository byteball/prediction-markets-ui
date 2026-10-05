import moment from "moment";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";

import { selectActiveAddress, selectActiveMarketParams, selectActiveRecentEvents, selectActiveRecentEventsCount } from "store/slices/activeSlice";
import { loadMoreRecentEvents } from "store/thunks/loadMoreRecentEvents";
import { useAppDispatch } from "store/hooks";

import i18n from "locale";
import appConfig from "appConfig";

import { Button } from "@/components/ui/button";

import styles from "./RecentEvents.module.css";

const limitStep = 5;

type RecentEvent = {
  type: "add_liquidity" | "buy_by_type" | "redeem" | "claim_profit" | string;
  trigger_unit: string;
  trigger_address: string;
  timestamp: number;
  reserve_amount: number;
  yes_amount: number;
  no_amount: number;
  draw_amount: number;
};

const explorerBase = `https://${appConfig.ENVIRONMENT === "testnet" ? "testnet" : ""}explorer.obyte.org`;

export const RecentEvents = () => {
  const { t } = useTranslation();
  const address = useSelector(selectActiveAddress);
  const notSortedData: RecentEvent[] = useSelector(selectActiveRecentEvents);
  const count: number = useSelector(selectActiveRecentEventsCount);

  const dispatch = useAppDispatch();

  const { reserve_decimals, reserve_symbol, yes_symbol, no_symbol, draw_symbol, yes_decimals, no_decimals, draw_decimals, allow_draw } = useSelector(selectActiveMarketParams);

  const data = useMemo(() => [...notSortedData].sort((a, b) => b.timestamp - a.timestamp), [notSortedData]);

  const showMoreButton = data.length < count;
  const currentPage = Math.trunc(data.length / limitStep);

  const loadMore = () => {
    dispatch(loadMoreRecentEvents({ address, page: currentPage + 1 }));
  };

  const RecentEventItem = ({ type, trigger_unit, trigger_address, timestamp, reserve_amount, yes_amount, no_amount, draw_amount }: RecentEvent) => {
    let Event = null;

    const reserveAmount = +Number(Math.abs(reserve_amount) / 10 ** reserve_decimals).toFixed(reserve_decimals);
    const yesAmount = +Number(Math.abs(yes_amount) / 10 ** reserve_decimals).toFixed(yes_decimals);
    const noAmount = +Number(Math.abs(no_amount) / 10 ** reserve_decimals).toFixed(no_decimals);
    const drawAmount = allow_draw ? +Number(Math.abs(draw_amount) / 10 ** reserve_decimals).toFixed(draw_decimals) : "";
    const format = ["ru", "uk"].includes(i18n.language) ? "D MMMM gggg [в] LT" : "LLL";

    const Count = () => (
      <>
        {yes_amount !== 0 ? <span style={{ color: appConfig.YES_COLOR }}>{` ${yesAmount} ${yes_symbol}`}</span> : ""}{" "}
        {no_amount !== 0 ? <span style={{ color: appConfig.NO_COLOR }}>{` ${noAmount} ${no_symbol}`}</span> : ""}
        {draw_amount !== 0 ? <span style={{ color: appConfig.DRAW_COLOR }}>{` ${drawAmount} ${draw_symbol}`}</span> : ""}
      </>
    );

    const addressLink = (
      <a href={`${explorerBase}/address/${trigger_address}`} target="_blank" rel="noopener">
        {{ address: trigger_address.slice(0, 16) } as unknown as string}...
      </a>
    );

    if (type === "add_liquidity") {
      Event = (
        <Trans i18nKey="recent_events.add_liquidity">
          {addressLink} sent {{ amount: reserveAmount } as unknown as string} {{ symbol: reserve_symbol } as unknown as string} to add liquidity <Count />
        </Trans>
      );
    } else if (type === "buy_by_type") {
      Event = (
        <Trans i18nKey="recent_events.buy">
          {addressLink} sent {{ amount: reserveAmount } as unknown as string} {{ symbol: reserve_symbol } as unknown as string} to buy <Count />
        </Trans>
      );
    } else if (type === "redeem") {
      Event = (
        <Trans i18nKey="recent_events.redeem">
          {addressLink} sold <Count /> for {{ amount: reserveAmount } as unknown as string} {{ symbol: reserve_symbol } as unknown as string}
        </Trans>
      );
    } else if (type === "claim_profit") {
      Event = (
        <Trans i18nKey="recent_events.claim_profit">
          {addressLink} profited {{ amount: reserveAmount } as unknown as string} {{ symbol: reserve_symbol } as unknown as string}
        </Trans>
      );
    }

    return (
      <div className={styles.eventWrap}>
        <div>{Event}</div>
        <a href={`${explorerBase}/${trigger_unit}`} target="_blank" rel="noopener" className={styles.timestamp}>
          {moment.unix(timestamp).format(format)}
        </a>
      </div>
    );
  };

  return (
    <div className={styles.eventList}>
      {data.length === 0 ? (
        <div className="py-4 text-center text-muted-foreground">{t("recent_events.no_events", "No events")}</div>
      ) : (
        <ul className="m-0 list-none p-0">
          {data.map((item) => (
            <li key={`ev-${item.trigger_unit}-${item.timestamp}`} className="border-b border-border py-4 last:border-b-0">
              <RecentEventItem {...item} />
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
