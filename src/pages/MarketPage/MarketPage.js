import { Row, Col, Space, Button, Radio, Spin, Result } from "antd";
import { Layout } from "components/Layout/Layout";
import { StatsCard } from "components/StatsCard/StatsCard";
import { Line } from '@ant-design/plots';
import { TradeModal } from "modals/TradeModal";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from 'moment';
import { isEmpty } from "lodash";

import { selectActiveCategory, selectActiveDailyCandles, selectActiveMarketParams, selectActiveMarketStateVars, selectActiveMarketStatus, selectActiveRecentEvents } from "store/slices/activeSlice";
import { setActiveMarket } from "store/thunks/setActiveMarket";
import { selectReserveAssets, selectReservesDailyUsdRate, selectReservesHourlyRate } from "store/slices/settingsSlice";
import { getMarketPriceByType } from "utils/getMarketPrices";
import { ViewParamsModal } from "modals/ViewParamsModal";
import Countdown from "antd/lib/statistic/Countdown";
import { RecentEvents } from "components/RecentEvents/RecentEvents";
import { generateLink } from "utils/generateLink";
import { ClaimProfitModal } from "modals/ClaimProfitModal";

import styles from './MarketPage.module.css';

const config = {
  xField: 'date',
  yField: 'value',
  seriesField: 'type',
  autoFit: true,
  animation: false,
  renderer: 'svg',
  smooth: true,
  appendPadding: 0,
  theme: 'dark',
  map: {
    style: 'dark',
  },
  color: ({ type }) => {
    return type === 'NO' ? '#ffa39e' : type === 'YES' ? '#b7eb8f' : '#ffe58f';
  },
  tooltip: {
    customContent: (title, items) => {
      return (
        <>
          <p style={{ marginTop: 16 }}>{title}</p>
          <ul style={{ paddingLeft: 0 }}>
            {items?.map((item, index) => {
              const { color, data: { currencySymbol, chartType, value, symbol, type, date } } = item;
              const valueView = chartType === 'prices' ? `$${value.toPrecision(4)}` : `${value} ${currencySymbol}`;

              return (
                <li
                  key={`${chartType}-${type}-${date}`}
                  data-index={index}
                  style={{ marginBottom: 12, display: 'flex', alignItems: 'center', }}
                >
                  <span className="g2-tooltip-marker" style={{ backgroundColor: color }}></span>
                  <span
                    style={{ display: 'inline-flex', flex: 1, justifyContent: 'space-between' }}
                  >
                    {chartType === 'prices' && <span className="g2-tooltip-list-item--4"><div style={{ paddingRight: 15 }}>{symbol}</div></span>}
                    <span className="g2-tooltip-list-item-value">{valueView}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      );
    }
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

  const { event, reserve_asset = 'base', allow_draw, reserve_symbol, reserve_decimals, yes_decimals, no_decimals, draw_decimals, yes_symbol, no_symbol, draw_symbol } = params;

  const actualReserveSymbol = reserveAssets[reserve_asset]?.symbol;

  const hourlyRates = useSelector(selectReservesHourlyRate);
  const dailyRates = useSelector(selectReservesDailyUsdRate);

  const nowHourTimestamp = moment.utc().startOf("hour").unix();
  const hourlyRateByReserveAsset = hourlyRates[reserve_asset] || {};

  const reserve_rate = !isEmpty(hourlyRateByReserveAsset) ? hourlyRateByReserveAsset[nowHourTimestamp] || hourlyRateByReserveAsset[nowHourTimestamp - 3600] || 0 : 0;
  const { reserve = 0, result } = stateVars;
  const viewReserve = +Number(reserve / 10 ** 9).toPrecision(5);
  const viewReserveInUSD = '$' + +Number((reserve / 10 ** reserve_decimals) * reserve_rate).toPrecision(2);

  const yesPrice = +getMarketPriceByType(stateVars, 'yes').toFixed(reserve_decimals);
  const noPrice = +getMarketPriceByType(stateVars, 'no').toFixed(reserve_decimals);
  const drawPrice = +getMarketPriceByType(stateVars, 'draw').toFixed(reserve_decimals);

  const yesPriceInUSD = '$' + +Number(yesPrice * reserve_rate).toPrecision(4);
  const noPriceInUSD = '$' + +Number(noPrice * reserve_rate).toPrecision(4);
  const drawPriceInUSD = '$' + +Number(drawPrice * reserve_rate).toPrecision(4);

  let tradeStatus;
  let tradeStatusColor;
  let tradeTimerExpiry;
  let tradeIsActive = false;
  let showCommitResultButton = false;
  let showClaimProfitButton = false;

  const [now, setNow] = useState(moment.utc().unix());
  const sevenDaysAlreadyPassed = now > (params.end_of_trading_period + 3600 * 24 * 7);

  const commitResultLink = generateLink({ aa: address, amount: 1e4, data: { commit: 1 } });

  useEffect(() => {
    const data = [];
    const nowByType = moment.utc().startOf(sevenDaysAlreadyPassed ? 'day' : "hour").unix();
    const step = sevenDaysAlreadyPassed ? 24 * 3600 : 3600;
    const currentReserveDailyRates = dailyRates[actualReserveSymbol] || {};

    candles.forEach(({ start_timestamp, yes_price, no_price, draw_price, supply_yes, supply_no, supply_draw }) => {
      const date = moment.unix(start_timestamp).format(sevenDaysAlreadyPassed ? 'll' : 'lll');

      if (chartType === 'prices') {
        const reserveRate = sevenDaysAlreadyPassed ? currentReserveDailyRates[nowByType] || currentReserveDailyRates[nowByType - step] : hourlyRateByReserveAsset[nowByType] || hourlyRateByReserveAsset[nowByType - step];

        data.push(
          { date, value: yes_price * reserveRate, type: "YES", currencySymbol: reserve_symbol, chartType, symbol: yes_symbol },
          { date, value: no_price * reserveRate, type: "NO", currencySymbol: reserve_symbol, chartType, symbol: no_symbol }
        );

        if (allow_draw) {
          data.push({ date, value: draw_price * reserveRate, type: "DRAW", currencySymbol: reserve_symbol, chartType, symbol: draw_symbol })
        }
      } else {
        data.push(
          { date, value: +Number(supply_yes / 10 ** yes_decimals).toFixed(yes_decimals), type: "YES", currencySymbol: yes_symbol, chartType },
          { date, value: +Number(supply_no / 10 ** no_decimals).toFixed(no_decimals), type: "NO", currencySymbol: no_symbol, chartType }
        );

        if (allow_draw) {
          data.push({ date, value: +Number(supply_draw / 10 ** draw_decimals).toFixed(draw_decimals), type: "DRAW", currencySymbol: draw_symbol, chartType },)
        }
      }
    });

    setDataForChart(data);
  }, [candles, chartType, address, dailyRates, hourlyRates]);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(moment.utc().unix()), 10000);

    return () => clearInterval(intervalId);
  });

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

  if (status !== 'loaded' || !actualReserveSymbol) return (<Layout>
    {(status === 'loading' || status === 'not selected' || !actualReserveSymbol)
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

      <div className={styles.infoWrap}>
        <Row gutter={30}>
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
      </div>

      {dataForChart.length > 0 && <div>
        <div style={{ display: 'flex', justifyContent: "flex-end", marginBottom: 10 }}>
          <Radio.Group value={chartType} onChange={(ev) => setChartType(ev.target.value)}>
            <Radio.Button value="prices">Prices</Radio.Button>
            <Radio.Button value="supplies">Supplies</Radio.Button>
          </Radio.Group>
        </div>
        <Line {...config} data={dataForChart} title='test21' />
      </div>}
      <div>
        <h2 style={{ marginBottom: 25, marginTop: 35 }}>Recent events</h2>
        <RecentEvents data={recentEvents} />
      </div>
    </div>
  </Layout>
}