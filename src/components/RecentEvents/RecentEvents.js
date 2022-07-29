import { Button, List } from "antd";
import moment from "moment";
import { useEffect, useState } from "react";

import appConfig from "appConfig";

import styles from "./RecentEvents.module.css";

const limitStep = 5;

export const RecentEvents = ({ data: notSortedData }) => {
  const [limit, setLimit] = useState(5);
  const [data, setData] = useState([]);

  useEffect(() => {
    setData([...notSortedData].sort((a, b) => b.timestamp - a.timestamp))
  }, [notSortedData]);

  const showMoreButton = data.length > limit;

  const increaseLimit = () => setLimit((limit) => limit + limitStep);

  return <List
    dataSource={data.slice(0, limit)}
    renderItem={RecentEventItem}
    className={styles.eventList}
    loadMore={showMoreButton ? <div className={styles.moreButtonWrap}><Button onClick={increaseLimit}>Show more</Button></div> : null}
    locale={{ emptyText: 'No events' }}
    size="large"
  />
}

const RecentEventItem = ({ Event, trigger_unit, timestamp }) => {
  return (<div className={styles.eventWrap}>
    <div key={`ev-${timestamp}`}>{Event || 'test'}</div>
    <a href={`https://${appConfig.ENVIRONMENT === 'testnet' ? 'testnet' : ''}explorer.obyte.org/#${trigger_unit}`} target="_blank" rel="noopener" className={styles.timestamp}>{moment.unix(timestamp).format("LLL")}</a>
  </div>)
}