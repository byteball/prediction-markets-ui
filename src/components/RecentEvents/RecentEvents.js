import { Button, List } from "antd";
import moment from "moment";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";

import { selectActiveAddress, selectActiveMarketParams, selectActiveRecentEvents, selectActiveRecentEventsCount } from "store/slices/activeSlice";
import { loadMoreRecentEvents } from "store/thunks/loadMoreRecentEvents";

import appConfig from "appConfig";

import styles from "./RecentEvents.module.css";

const limitStep = 5;

export const RecentEvents = () => {
  const [data, setData] = useState([]);
  const { t } = useTranslation();
  const address = useSelector(selectActiveAddress);
  const notSortedData = useSelector(selectActiveRecentEvents);
  const count = useSelector(selectActiveRecentEventsCount);

  const dispatch = useDispatch();

  const { reserve_decimals, reserve_symbol, yes_symbol, no_symbol, draw_symbol, yes_decimals, no_decimals, draw_decimals, allow_draw } = useSelector(selectActiveMarketParams);

  useEffect(() => {
    setData([...notSortedData].sort((a, b) => b.timestamp - a.timestamp))
  }, [notSortedData]);

  const showMoreButton = data.length < count;
  const currentPage = Math.trunc(data.length / limitStep);

  const loadMore = () => {
    dispatch(loadMoreRecentEvents({ address, page: currentPage + 1 }))
  };

  const RecentEventItem = ({ type, trigger_unit, trigger_address, timestamp, reserve_amount, yes_amount, no_amount, draw_amount }) => {
    let Event = null;

    const reserveAmount = +Number(Math.abs(reserve_amount) / 10 ** reserve_decimals).toFixed(reserve_decimals);
    const yesAmount = +Number(Math.abs(yes_amount) / 10 ** reserve_decimals).toFixed(yes_decimals);
    const noAmount = +Number(Math.abs(no_amount) / 10 ** reserve_decimals).toFixed(no_decimals);
    const drawAmount = allow_draw ? +Number(Math.abs(draw_amount) / 10 ** reserve_decimals).toFixed(draw_decimals) : '';

    if (type === 'add_liquidity' || type === 'buy_by_type') {
      const count = <>{yes_amount !== 0 ? <span style={{ color: appConfig.YES_COLOR }}>{` ${yesAmount} ${yes_symbol}`}</span> : ''} {no_amount !== 0 ? <span style={{ color: appConfig.NO_COLOR }}>{` ${noAmount} ${no_symbol}`}</span> : ''}{draw_amount !== 0 ? <span style={{ color: appConfig.DRAW_COLOR }}>{` ${drawAmount} ${draw_symbol}`}</span> : ''}</>;

      if (type === 'add_liquidity') {
        Event = <Trans i18nKey="recent_events.add_liquidity">
          <a href={`https://${appConfig.ENVIRONMENT === 'testnet' ? 'testnet' : ''}explorer.obyte.org/address/${trigger_address}`} target="_blank" rel="noopener">{{address: trigger_address.slice(0, 16)}}...</a> sent {{amount: reserveAmount}} {{symbol: reserve_symbol}} to add liquidity {count}
        </Trans>
      } else {
        Event = <Trans i18nKey="recent_events.buy">
          <a href={`https://${appConfig.ENVIRONMENT === 'testnet' ? 'testnet' : ''}explorer.obyte.org/address/${trigger_address}`} target="_blank" rel="noopener">{{address: trigger_address.slice(0, 16)}}...</a> sent {{amount: reserveAmount}} {{symbol: reserve_symbol}} to buy {count}
        </Trans>
      }
    } else if (type === 'redeem') {
      const count = <>{yes_amount !== 0 ? <span style={{ color: appConfig.YES_COLOR }}>{` ${yesAmount} ${yes_symbol}`}</span> : ''} {no_amount !== 0 ? <span style={{ color: appConfig.NO_COLOR }}>{` ${noAmount} ${no_symbol}`}</span> : ''}{draw_amount !== 0 ? <span style={{ color: appConfig.DRAW_COLOR }}>{` ${drawAmount} ${draw_symbol}`}</span> : ''}</>;

      Event = <Trans i18nKey="recent_events.redeem">
        <a href={`https://${appConfig.ENVIRONMENT === 'testnet' ? 'testnet' : ''}explorer.obyte.org/address/${trigger_address}`} target="_blank" rel="noopener">{{ address: trigger_address.slice(0, 16) }}...</a> sold {count} for {{ amount: reserveAmount }} {{ symbol: reserve_symbol }}
      </Trans>
    } else if (type === 'claim_profit') {
      Event = <Trans i18nKey="recent_events.claim_profit">
        <a href={`https://${appConfig.ENVIRONMENT === 'testnet' ? 'testnet' : ''}explorer.obyte.org/address/${trigger_address}`} target="_blank" rel="noopener">{{ address: trigger_address.slice(0, 16) }}...</a> profited {{ amount: reserveAmount }} {{ symbol: reserve_symbol }}
      </Trans>
    }

    return (<div className={styles.eventWrap}>
      <div key={`ev-${timestamp}`}>{Event}</div>
      <a href={`https://${appConfig.ENVIRONMENT === 'testnet' ? 'testnet' : ''}explorer.obyte.org/${trigger_unit}`} target="_blank" rel="noopener" className={styles.timestamp}>{moment.unix(timestamp).format("LLL")}</a>
    </div>)
  }

  return <List
    dataSource={data}
    renderItem={RecentEventItem}
    className={styles.eventList}
    loadMore={showMoreButton ? <div className={styles.moreButtonWrap}><Button onClick={loadMore}>{t("recent_events.show_more", 'Show more')}</Button></div> : null}
    locale={{ emptyText: t('recent_events.no_events', 'No events') }}
    size="large"
  />
}