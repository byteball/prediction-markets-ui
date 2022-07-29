import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Divider, List, Spin } from "antd";
import { isEmpty } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

import { PredictionItem } from "./PredictionItem";
import { SwitchActions } from "components/SwitchActions/SwitchActions";
import { selectAllMarkets, selectAllMarketsCount, selectChampionships, selectCurrencyMarkets, selectCurrencyMarketsCount, selectMiscMarkets, selectMiscMarketsCount, selectPopularCurrencies } from "store/slices/marketsSlice";
import { loadSportsCalendarCache } from "store/thunks/loadSportsCalendarCache";
import { selectMarketsCache } from "store/slices/cacheSlice";
import { loadMarketsInCache } from "store/thunks/loadMarketsInCache";

import { getEmojiByType } from "utils";
import backend from "services/backend";

import styles from "./PredictionList.module.css";
import { loadCurrencyCalendarCache } from "store/thunks/loadCurrencyCalendarCache";
import { historyInstance } from "historyInstance";

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

  // const { ch } = useParams();


  // useEffect(() => {
  //   if (ch) {
  //     setParticle(ch);
  //   }

  //   setInited(true);
  // }, []);

  // useEffect(() => {
  //   if (ch && ch !== particle) {
  //     setParticle(ch)
  //   }
  // }, [location.pathname])

  useEffect(async () => {
    setLoading(true);

    if (allMarkets.length > 0 && !isEmpty(championships)) { //&& inited
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
        const { data: newDataSource, max_count } = await backend.getMarketsByType({
          type,
          championship: particle !== 'all' ? particle : undefined,
          page: 1
        });

        // if (location.pathname !== `/${type}/${particle}`) {
        //   navigate(`/${type}/${particle}`);
        // }

        // historyInstance.replace(`/${type}/${particle}`);
        // historyInstance.deleteUrl(`/${type}`)

        dataSource = newDataSource;
        count = max_count;

        const { data } = await backend.getSportsCalendar(type, particle);
        calendarData = data;
      }

      setMaxCount(count);
      setMarketsDataSource(dataSource);

      if (type !== 'currency') {
        setCalendarDataSource(calendarData);
      }

      setLoading(false);
    }
  }, [allMarkets, type, championships, particle]) //inited

  useEffect(async () => {
    if (type === 'currency') { //&& inited
      const { data } = await backend.getCurrencyCalendar(actualCurrency);

      setCalendarDataSource(data);
    }
  }, [type, actualCurrency]) //inited

  const getActionList = useCallback(() => ([
    { value: 'all', text: `${getEmojiByType(type)} All soccer` },
    ...championships[type]?.map(({ name, code, emblem }) => ({ value: code, text: name, iconLink: emblem }))
  ]), [championships, type])

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

  if (championship) {
    currentMarketsCache = marketsCache[type]?.[championship]?.data || [];
  } else {
    currentMarketsCache = marketsCache[type]?.data || [];
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
      // console.log(1);
    } else if (loading && ['all', 'misc'].includes(type)) {
      setInited(true)
      // console.log(2);
    } else if (location.hash !== "#calendar") {
      setInited(true);
      // console.log(3);
    }

    // console.log('for 4: ', calendarRef.current, !loading, !inited, !['all', 'misc'].includes(type), location.hash === "#calendar")
    // console.log(4);
  }, [inited, calendarRef.current, location.hash, loading, fullCalendarDataSource]);

  useEffect(()=> {
    if(inited && location.hash === "#calendar"){
      historyInstance.replace(location.pathname)
    }
  }, [inited]);

  return <>
    {(type in championships) && championships[type].length > 0 && <div>
      <SwitchActions small={true} value={championship} data={getActionList()} onChange={handleChangeChampionship} />
    </div>}

    {!loading ? <>
      <List
        dataSource={fullDataSource}
        style={{ marginBottom: 50 }}
        rowKey={(item) => `${type}-${item.aa_address}`}
        locale={{ emptyText: type === 'all' ? 'no markets' : `no ${type} markets` }}
        renderItem={(data) => <PredictionItem {...data} particle={particle} type={type} />}
        loadMore={fullDataSource.length < maxCount && <div className={styles.loadMoreWrap}>
          <Button onClick={() => dispatch(loadMarketsInCache({ championship, page: currentPage + 1, type }))}>Load more</Button>
        </div>}
      />

      {(type in championships || type === 'currency') && <div><Divider dashed className={styles.calendarHeader}>{type === 'currency' ? 'create new markets' : 'calendar of upcoming matches'}</Divider></div>}

      {type === 'currency' && popularCurrencies.length > 0 && <div>
        <SwitchActions small={true} value={actualCurrency} data={getCurrencyCalendarActionList()} onChange={(currency) => setActualCurrency(currency)} />
      </div>}

      {(type in championships || type === 'currency') && (fullCalendarDataSource.length > 0 ? <div ref={calendarRef}>
        <List
          dataSource={fullCalendarDataSource}
          style={{ marginTop: 10 }}
          rowKey={(item) => `${type}-${item.aa_address}`}
          locale={{ emptyText: type === 'all' ? 'no markets' : `no ${type} markets` }}
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