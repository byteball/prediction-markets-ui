import { PageHeader, Typography, Row, Col, Space, Button, Statistic, Tooltip, Radio, Spin, Result } from "antd"
import { Layout } from "components/Layout/Layout";
import { StatsCard } from "components/StatsCard/StatsCard";
import styles from './MarketPage.module.css';
// import { data } from "pages/MainPage/PredictionItem";
import { Line } from '@ant-design/plots';
import { TradeModal } from "modals/TradeModal";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from 'moment';

import { selectActiveCategory, selectActiveDailyCandles, selectActiveMarketParams, selectActiveMarketStateVars, selectActiveMarketStatus, selectActiveRecentEvents } from "store/slices/activeSlice";
import { setActiveMarket } from "store/thunks/setActiveMarket";
import { selectReserveAssets, selectReservesToUsdRate } from "store/slices/settingsSlice";
import { getMarketPriceByType } from "utils/getMarketPrices";
import { ViewParamsModal } from "modals/ViewParamsModal";
import Countdown from "antd/lib/statistic/Countdown";
import { RecentEvents } from "components/RecentEvents/RecentEvents";
import { generateLink } from "utils/generateLink";
import { ClaimProfitModal } from "modals/ClaimProfitModal";

const config = {
  xField: 'date',
  yField: 'value',
  seriesField: 'type',
  autoFit: true,
  animation: false,
  renderer: 'svg',
  smooth: true,
  antialias: true,
  appendPadding: 0,
  color: ({ type }) => {
    return type === 'NO' ? '#ffa39e' : type === 'YES' ? '#b7eb8f' : '#ffe58f';
  }
};

export const MarketPage = () => {
  const { address } = useParams();
  const dispatch = useDispatch();
  const [chartType, setChartType] = useState('prices')
  const [dataForChart, setDataForChart] = useState([]);

  const status = useSelector(selectActiveMarketStatus);
  // const markets = useSelector(selectAllMarkets);
  const reserveAssets = useSelector(selectReserveAssets);
  const stateVars = useSelector(selectActiveMarketStateVars);
  const category = useSelector(selectActiveCategory);
  const candles = useSelector(selectActiveDailyCandles);

  const params = useSelector(selectActiveMarketParams);
  const recentEvents = useSelector(selectActiveRecentEvents);

  const { event, reserve_asset, allow_draw, reserve_symbol, reserve_decimals } = params;

  const actualReserveSymbol = Object.entries(reserveAssets).find(([_, asset]) => asset === reserve_asset)?.[0];

  const rates = useSelector(selectReservesToUsdRate);
  const nowHourTimestamp = moment.utc().startOf("hour").unix();

  const reserve_rate = rates ? rates[actualReserveSymbol]?.[nowHourTimestamp] || rates[reserve_symbol]?.[nowHourTimestamp - 3600] || 0 : 0;
  const { reserve = 0, result } = stateVars;
  const viewReserve = +Number(reserve / 10 ** 9).toPrecision(5);
  const viewReserveInUSD = '$' + +Number((reserve / 10 ** reserve_decimals) * reserve_rate).toPrecision(2);

  const yesPrice = +getMarketPriceByType(stateVars, 'yes').toFixed(reserve_decimals);
  const noPrice = +getMarketPriceByType(stateVars, 'no').toFixed(reserve_decimals);
  const drawPrice = +getMarketPriceByType(stateVars, 'draw').toFixed(reserve_decimals);

  const yesPriceInUSD = '$' + +Number(yesPrice * reserve_rate).toPrecision(2);
  const noPriceInUSD = '$' + +Number(noPrice * reserve_rate).toPrecision(2);
  const drawPriceInUSD = '$' + +Number(drawPrice * reserve_rate).toPrecision(2);

  let tradeStatus;
  let tradeStatusColor;
  let tradeTimerExpiry;
  let tradeIsActive = false;
  let showCommitResultButton = false;
  let showClaimProfitButton = false;

  const [now, setNow] = useState(moment.utc().unix());
  // const now = 

  const commitResultLink = generateLink({ aa: address, amount: 1e4, data: { commit: 1 } });

  useEffect(() => {
    const data = [];
    // {
    //   "date": "1850",
    //   "value": 0,
    //   "type": "YES"
    // },

    candles.forEach(({ start_timestamp, yes_price, no_price, draw_price, supply_yes, supply_no, supply_draw }) => {
      if (chartType === 'prices') {
        data.push(
          { date: start_timestamp, value: yes_price, type: "YES" },
          { date: start_timestamp, value: no_price, type: "NO" }
        );

        if (allow_draw) {
          data.push({ date: start_timestamp, value: draw_price, type: "DRAW" },)
        }
      } else {
        data.push(
          { date: start_timestamp, value: supply_yes, type: "YES" },
          { date: start_timestamp, value: supply_no, type: "NO" }
        );

        if (allow_draw) {
          data.push({ date: start_timestamp, value: supply_draw, type: "DRAW" },)
        }
      }
    });

    setDataForChart(data);
    console.log('data', data)
  }, [candles, chartType, address]);
  // console.log('time', now + 1000)

  useEffect(() => {
    const intervalId = setInterval(() => setNow(moment.utc().unix()), 10000);

    return () => clearInterval(intervalId);
  })
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [])

  if (params.end_of_trading_period > now) {
    tradeStatus = "ACTIVE TRADE"
    tradeStatusColor = 'green'
    tradeTimerExpiry = params.end_of_trading_period;
    tradeIsActive = true;
  } else if (result) {
    tradeStatus = "TRADE IS OVER";
    showClaimProfitButton = true;
    tradeStatusColor = 'red';
  } else if ('result' in stateVars) {
    tradeStatus = "RESULTS ANNOUNCED";
    tradeStatusColor = 'red';
  } else if (params.end_of_trading_period + params.waiting_period_length > now) {
    tradeStatus = "WAITING PERIOD";
    tradeStatusColor = '#f39c12';
    tradeTimerExpiry = params.end_of_trading_period + params.waiting_period_length;
    showCommitResultButton = true;
  } else {
    tradeStatus = "RESUMED TRADING";
    tradeStatusColor = 'green';
    tradeIsActive = true;
  }

  useEffect(() => {
    if (address) {
      dispatch(setActiveMarket(address))
    }
  }, [address]);
  console.log("chartType", chartType)
  if (status !== 'loaded') return (<Layout>
    {(status === 'loading' || status === 'not selected')
      ? <div style={{ margin: 20, display: 'flex', justifyContent: 'center' }}><Spin size="large" /></div>
      : <Result
        status="warning"
        title="There was an error loading"
        subTitle="Try a little later or write to the discord"
        extra={
          <Link to="/">
            <Button type="primary" key="console">
              Go back
            </Button>
          </Link>}
      />}
  </Layout>)

  return <Layout>
    <div style={{ marginTop: 50 }}>
      <Space>
        <a href="#" className={styles.category}>{category}</a>
      </Space>
      <h1 style={{ maxWidth: 800 }}>{event}</h1>

      <Space size='large' style={{ marginBottom: 15 }}>
        <TradeModal disabled={!tradeIsActive} />
        {showCommitResultButton && <Button type="primary" size="large" href={commitResultLink}>Commit result</Button>}
        {showClaimProfitButton && <ClaimProfitModal />}
        <ViewParamsModal {...params} />
      </Space>

      <Row className={styles.infoWrap} gutter={30}>
        <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
          <StatsCard title="Yes price" value={yesPriceInUSD} subValue={<span>{yesPrice} <small>{reserve_symbol}</small></span>} />
        </Col>
        <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
          <StatsCard title="No price" value={noPriceInUSD} subValue={<span>{noPrice} <small>{reserve_symbol}</small></span>} />
        </Col>
        {allow_draw && <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
          <StatsCard title="Draw price" value={drawPriceInUSD} subValue={<span>{drawPrice} <small>{reserve_symbol}</small></span>} />
        </Col>}
        <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
          <StatsCard title="Reserve" value={viewReserveInUSD} subValue={<span>{viewReserve} <small>{reserve_symbol}</small></span>} />
        </Col>

        <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
          <StatsCard title="time to expiration" showChart={false} value={tradeTimerExpiry ? <Countdown value={moment.unix(tradeTimerExpiry)} format="DD [days] HH:mm:ss" /> : '-'} subValue={<span>STATUS: <span style={{ color: tradeStatusColor, textTransform: 'uppercase' }}>{tradeStatus}</span></span>} />
        </Col>
      </Row>

      <div>
        {/* <h2 style={{ marginBottom: 25, marginTop: 35 }}>Comparison chart</h2> */}
        <div style={{ display: 'flex', justifyContent: "flex-end", marginBottom: 10 }}>
          <Radio.Group value={chartType} onChange={(ev) => setChartType(ev.target.value)}>
            <Radio.Button value="prices">Prices</Radio.Button>
            <Radio.Button value="supplies">Supplies</Radio.Button>
          </Radio.Group>
        </div>
        <Line {...config} data={dataForChart} />
      </div>
      <div>
        <h2 style={{ marginBottom: 25, marginTop: 35 }}>Recent events</h2>
        <RecentEvents data={recentEvents} />
      </div>
    </div>
  </Layout>
}