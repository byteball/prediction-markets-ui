import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Divider, List, Spin } from "antd";
import { isEmpty } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { t } from "i18next";

import { PredictionItem } from "./PredictionItem";
import { SwitchActions } from "components/SwitchActions/SwitchActions";
import {
  selectAllMarkets,
  selectAllMarketsCount,
  selectChampionships,
  selectCurrencyMarkets,
  selectCurrencyMarketsCount,
  selectMiscMarkets,
  selectMiscMarketsCount,
  selectPopularCurrencies
} from "store/slices/marketsSlice";
import { loadSportsCalendarCache } from "store/thunks/loadSportsCalendarCache";
import { selectMarketsCache } from "store/slices/cacheSlice";
import { loadMarketsInCache } from "store/thunks/loadMarketsInCache";
import { loadCurrencyCalendarCache } from "store/thunks/loadCurrencyCalendarCache";

import { getEmojiByType, transformChampionshipName } from "utils";
import { historyInstance } from "historyInstance";
import backend from "services/backend";

import styles from "./PredictionList.module.css";


export const PredictionList = ({ type = 'all', particle = 'all', setParticle }) => {
  const [marketsDataSource, setMarketsDataSource] = useState([]);
  const [calendarDataSource, setCalendarDataSource] = useState([]);
  const [actualCurrency, setActualCurrency] = useState('GBYTE');
  const [maxCount, setMaxCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const calendarRef = useRef(null);

  const [inited, setInited] = useState(false);

  const currencyMarkets = useSelector(selectCurrencyMarkets);
  const currencyMarketsCount = useSelector(selectCurrencyMarketsCount);

  const allMarkets = useSelector(selectAllMarkets);
  const allMarketsCount = useSelector(selectAllMarketsCount);

  const miscMarkets = useSelector(selectMiscMarkets);
  const miscMarketsCount = useSelector(selectMiscMarketsCount);

  const championships = useSelector(selectChampionships);
  const popularCurrencies = useSelector(selectPopularCurrencies);

  const marketsCache = useSelector(selectMarketsCache);

  const dispatch = useDispatch();
  const location = useLocation();

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
      } else if (type === 'misc') {
        dataSource = miscMarkets;
        count = miscMarketsCount;
      } else if (type in championships) {
        dispatch(loadMarketsInCache({ championship, page: 1, type }));
        const { data } = await backend.getSportsCalendar(type, particle);
        dataSource = [];
        calendarData = data;
      }

      setMaxCount(count);
      setMarketsDataSource(dataSource);

      if (type !== 'currency') {
        setCalendarDataSource(calendarData);
      }

      setLoading(false);
    }
  }, [allMarkets, type, championships, particle]);

  useEffect(async () => {
    if (type === 'currency') {
      const { data } = await backend.getCurrencyCalendar(actualCurrency);

      setCalendarDataSource(data);
    }
  }, [type, actualCurrency]);

  const getActionList = useCallback(() => ([
    { value: 'all', text: `${getEmojiByType(type)} All soccer` },
    ...championships[type]?.map(({ name, code, emblem }) => ({ value: code, text: transformChampionshipName(name, code), iconLink: emblem }))
  ]), [championships, type]);

  const getCurrencyCalendarActionList = useCallback(() => ([
    ...popularCurrencies?.map((currency) => ({ value: currency, text: currency }))
  ]), [popularCurrencies]);

  let calendarPage = 1;
  let calendarMaxCount = Infinity;

  const championship = type in championships ? particle || championships?.[type]?.[0] || null : null;
  const currentCalendarCache = type === 'currency' ? marketsCache.calendar?.currency?.[actualCurrency]?.data || [] : marketsCache.calendar?.[type]?.[championship]?.data || [];
  const fullCalendarDataSource = [...calendarDataSource, ...currentCalendarCache];

  if (calendarDataSource.length > 0 && (type in championships || type === 'currency')) {
    calendarPage = Math.ceil(fullCalendarDataSource.length / 5);
  }

  if (marketsCache.calendar?.[type]?.[championship]) {
    calendarMaxCount = marketsCache.calendar?.[type]?.[championship].count;
  } else if (type === 'currency' && marketsCache.calendar?.currency?.[actualCurrency]?.count) {
    calendarMaxCount = marketsCache.calendar?.currency?.[actualCurrency]?.count;
  }

  let currentMarketsCache;
  let countOfSportMarkets;

  if (championship) {
    currentMarketsCache = marketsCache[type]?.[championship]?.data || [];
    countOfSportMarkets = marketsCache[type]?.[championship]?.count;
  } else {
    currentMarketsCache = marketsCache[type]?.data || [];
    countOfSportMarkets = marketsCache[type]?.count;
  }

  const fullDataSource = [...marketsDataSource, ...currentMarketsCache];

  let currentPage = Math.ceil(fullDataSource.length / 5);

  const handleChangeChampionship = (championship) => {
    if (championship !== particle) {
      setParticle(championship);
    }
  }

  const loadCalendarMore = () => {
    if (type === 'currency') {
      dispatch(loadCurrencyCalendarCache({ page: calendarPage + 1, currency: actualCurrency }))
    } else {
      dispatch(loadSportsCalendarCache({ sport: type, championship: particle || championships[type][0], page: calendarPage + 1 }))
    }
  }

  useEffect(() => {
    if (fullCalendarDataSource.length > 0 && location.hash === "#calendar" && calendarRef.current && !loading && !inited && !['all', 'misc'].includes(type)) {
      calendarRef.current.scrollIntoView({ behavior: "smooth", alignToTop: false, block: "center" });
      setInited(true);
    } else if (loading && ['all', 'misc'].includes(type)) {
      setInited(true)
    } else if (location.hash !== "#calendar") {
      setInited(true);
    }

  }, [inited, calendarRef.current, location.hash, loading, fullCalendarDataSource]);

  useEffect(() => {
    if (inited && location.hash === "#calendar") {
      historyInstance.replace(location.pathname)
    }
  }, [inited]);

  return <>
    {(type in championships) && championships[type].length > 0 && <div>
      <SwitchActions small={true} value={championship} data={getActionList()} onChange={handleChangeChampionship} />
    </div>}

    {!loading && (!(type in championships) || countOfSportMarkets !== undefined) ? <>
      <List
        dataSource={fullDataSource}
        style={{ marginBottom: 50 }}
        rowKey={(item) => `${type}-${item.aa_address}`}
        locale={{ emptyText: type === 'all' ? t("common.no_markets", 'no markets') : t("common.no_markets_type", 'no {{type}} markets', { type }) }}
        renderItem={(data) => <PredictionItem {...data} particle={particle} type={type} />}
        loadMore={fullDataSource.length < ((type in championships) ? countOfSportMarkets : maxCount) && <div className={styles.loadMoreWrap}>
          <Button onClick={() => dispatch(loadMarketsInCache({ championship, page: currentPage + 1, type }))}>Load more</Button>
        </div>}
      />

      {(type in championships || type === 'currency') && <div><Divider dashed className={styles.calendarHeader}>{type === 'currency' ? t("prediction_list.title_create", 'create new markets') : t("prediction_list.title_calendar", 'calendar of upcoming matches')}</Divider></div>}

      {type === 'currency' && popularCurrencies.length > 0 && <div>
        <SwitchActions small={true} value={actualCurrency} data={getCurrencyCalendarActionList()} onChange={(currency) => setActualCurrency(currency)} />
      </div>}

      {(type in championships || type === 'currency') && (fullCalendarDataSource.length > 0 ? <div ref={calendarRef}>
        <List
          dataSource={fullCalendarDataSource}
          style={{ marginTop: 10 }}
          rowKey={(item) => `${type}-${item.aa_address}`}
          locale={{ emptyText: type === 'all' ? t("common.no_markets", 'no markets') : t("common.no_markets_type", 'no {{type}} markets', { type }) }}
          renderItem={(data) => <PredictionItem {...data} particle={particle} type={type} />}
          loadMore={fullCalendarDataSource.length < calendarMaxCount && <div className={styles.loadMoreWrap}>
            <Button onClick={loadCalendarMore}>Load more</Button>
          </div>}
        />
      </div> : <div className={styles.spinWrap}>
        <Spin size="large" />
      </div>)}
    </> : <div className={styles.spinWrap}>
      <Spin size="large" />
    </div>}
  </>
}