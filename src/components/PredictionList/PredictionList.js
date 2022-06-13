import { useCallback, useEffect, useState } from "react";
import { Button, Divider, List, Spin } from "antd";
import { isEmpty } from "lodash";
import { useDispatch, useSelector } from "react-redux";

import { PredictionItem } from "./PredictionItem";
import { SwitchActions } from "components/SwitchActions/SwitchActions";
import { selectAllMarkets, selectAllMarketsCount, selectChampionships, selectCurrencyMarkets, selectCurrencyMarketsCount } from "store/slices/marketsSlice";
import { loadSportsCalendarCache } from "store/thunks/loadSportsCalendarCache";
import { selectMarketsCache } from "store/slices/cacheSlice";
import { loadMarketsInCache } from "store/thunks/loadMarketsInCache";

import { getEmojiByType } from "utils";
import backend from "services/backend";

export const PredictionList = ({ type = 'all' }) => {
  const [marketsDataSource, setMarketsDataSource] = useState([]);
  const [calendarDataSource, setCalendarDataSource] = useState([]);
  const [actualChampionship, setActualChampionship] = useState('all');
  const [maxCount, setMaxCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const currencyMarkets = useSelector(selectCurrencyMarkets);
  const allMarkets = useSelector(selectAllMarkets);
  const championships = useSelector(selectChampionships);
  const marketsCache = useSelector(selectMarketsCache);
  const allMarketsCount = useSelector(selectAllMarketsCount);
  const currencyMarketsCount = useSelector(selectCurrencyMarketsCount);

  const dispatch = useDispatch();

  useEffect(async () => {
    setLoading(true);

    if (allMarkets.length > 0 && !isEmpty(championships)) {
      let dataSource = [];
      let calendarData = [];
      let count = 0;

      if (type === 'all') {
        dataSource = allMarkets;
        count = allMarketsCount;
      } else if (type === 'currency') {
        dataSource = currencyMarkets;
        count = currencyMarketsCount;
      } else if (type in championships) {
        const { data: newDataSource, max_count } = await backend.getMarketsByType({
          type,
          championship: actualChampionship !== 'all' ? actualChampionship : undefined,
          page: 1
        });

        dataSource = newDataSource;
        count = max_count;

        const { data } = await backend.getSportsCalendar(type, actualChampionship);
        calendarData = data;
      }

      setMaxCount(count);
      setMarketsDataSource(dataSource);
      setCalendarDataSource(calendarData);
      setLoading(false);
    }
  }, [allMarkets, type, championships, actualChampionship])

  const getActionList = useCallback(() => ([
    { value: 'all', text: `${getEmojiByType(type)} All soccer` },
    ...championships[type]?.map(({ name, code, emblem }) => ({ value: code, text: name, iconLink: emblem }))
  ]), [championships, type])

  let calendarPage = 1;
  let calendarMaxCount = 999999;

  const championship = type in championships ? actualChampionship || championships?.[type]?.[0] || null : null;
  const currentCalendarCache = marketsCache.calendar?.[type]?.[championship]?.data || [];
  const fullCalendarDataSource = [...calendarDataSource, ...currentCalendarCache];

  if (calendarDataSource.length > 0 && (type in championships)) {
    calendarPage = Math.ceil(fullCalendarDataSource.length / 5);
  }

  if (marketsCache.calendar?.[type]?.[championship]) {
    calendarMaxCount = marketsCache.calendar?.[type]?.[championship].count;
  }

  let currentMarketsCache;

  if (championship) {
    currentMarketsCache = marketsCache[type]?.[championship]?.data || [];
  } else {
    currentMarketsCache = marketsCache[type]?.data || [];
  }

  const fullDataSource = [...marketsDataSource, ...currentMarketsCache];

  let currentPage = Math.ceil(fullDataSource.length / 5);

  return <>
    {(type in championships) && championships[type].length > 0 && <div>
      <SwitchActions small={true} value={championship} data={getActionList()} onChange={(action) => { setActualChampionship(action) }} />
    </div>}

    {!loading ? <>
      <List
        dataSource={fullDataSource}
        style={{ marginBottom: 50 }}
        rowKey={(item) => `${type}-${item.aa_address}`}
        locale={{ emptyText: type === 'all' ? 'no markets' : `no ${type} markets` }}
        renderItem={(data) => <PredictionItem {...data} actualChampionship={actualChampionship} type={type} />}
        loadMore={fullDataSource.length < maxCount && <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button onClick={() => dispatch(loadMarketsInCache({ championship, page: currentPage + 1, type }))}>Load more</Button>
        </div>}
      />

      {fullCalendarDataSource.length > 0 && (type in championships) && <Divider dashed style={{ textTransform: 'uppercase', fontSize: 24 }}>calendar of upcoming matches</Divider>}

      {fullCalendarDataSource.length > 0 && (type in championships) && <List
        dataSource={fullCalendarDataSource}
        style={{ marginTop: 30 }}
        rowKey={(item) => `${type}-${item.aa_address}`}
        locale={{ emptyText: type === 'all' ? 'no markets' : `no ${type} markets` }}
        renderItem={(data) => <PredictionItem {...data} actualChampionship={actualChampionship} type={type} />}
        loadMore={fullCalendarDataSource.length < calendarMaxCount && <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button onClick={() => dispatch(loadSportsCalendarCache({ sport: type, championship: actualChampionship || championships[type][0], page: calendarPage + 1 }))}>Load more</Button>
        </div>}
      />}
    </> : <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 10px' }}>
      <Spin size="large" />
    </div>}
  </>
}