import { Row, Col, Space, Button, Radio, Spin, Result, Tooltip, Typography } from "antd";
import { Layout } from "components/Layout/Layout";
import { StatsCard } from "components/StatsCard/StatsCard";
import { Line, Pie } from '@ant-design/plots';
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from 'moment';
import QRButton from "obyte-qr-button";
import Countdown from "antd/lib/statistic/Countdown";

import { selectActiveCategory, selectActiveDailyCandles, selectActiveDatafeedValue, selectActiveMarketParams, selectActiveMarketStateVars, selectActiveMarketStatus, selectActiveRecentEvents } from "store/slices/activeSlice";
import { setActiveMarket } from "store/thunks/setActiveMarket";
import { selectReserveAssets, selectReservesRate } from "store/slices/settingsSlice";
import { getMarketPriceByType, generateLink } from "utils";
import { RecentEvents } from "components/RecentEvents/RecentEvents";
import { AddLiquidityModal, ClaimProfitModal, ViewParamsModal, TradeModal } from "modals";

import styles from './MarketPage.module.css';

const chartConfig = {
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
    return type === 'NO' ? '#ff5e57' : type === 'YES' ? '#05c46b' : '#ffc048';
  },
  tooltip: {
    customContent: (title, items) => {
      return (
        <>
          <p style={{ marginTop: 16 }}>{title}</p>
          <ul style={{ paddingLeft: 0 }}>
            {items?.map((item, index) => {
              const { color, data: { currencySymbol, chartType, value, symbol, type, date } } = item;
              const valueView = chartType === 'fee' ? `${+value.toPrecision(4)}%` : `${+value.toPrecision(9)} ${currencySymbol}`; //chartType === 'prices' ? `$${value.toPrecision(4)}` :

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
  const [visibleTradeModal, setVisibleTradeModal] = useState(false)
  const [dataForChart, setDataForChart] = useState([]);
  const [dataForPie, setDataForPie] = useState([]);

  const status = useSelector(selectActiveMarketStatus);
  const reserveAssets = useSelector(selectReserveAssets);
  const stateVars = useSelector(selectActiveMarketStateVars);
  const category = useSelector(selectActiveCategory);
  const candles = useSelector(selectActiveDailyCandles);
  const datafeedValue = useSelector(selectActiveDatafeedValue);

  const params = useSelector(selectActiveMarketParams);
  const recentEvents = useSelector(selectActiveRecentEvents);

  const { event, reserve_asset = 'base', allow_draw, reserve_symbol, reserve_decimals, yes_decimals, no_decimals, draw_decimals, yes_symbol, no_symbol, draw_symbol } = params;

  const actualReserveSymbol = reserveAssets[reserve_asset]?.symbol;

  const reservesRate = useSelector(selectReservesRate);

  const reserve_rate = reservesRate[reserve_asset];

  const { reserve = 0, result, supply_yes = 0, supply_no = 0, supply_draw = 0 } = stateVars;
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

  const pieConfig = {
    angleField: 'value',
    colorField: 'type',
    legend: false,
    animation: false,
    label: {
      type: 'inner',
      content: (item) => `${item.type} tokens
      ${item.value} ${reserve_symbol}
      ${Number(item.percent * 100).toPrecision(4)}% 
      `,
      style: {
        fontSize: 13,
        textAlign: "center",
        fill: "#fff",
        fontWeight: 'bold',
        textStroke: '2px red'
      },
      autoHide: true,
      autoRotate: false
    },
    appendPadding: 10,
    radius: 0.8,
    renderer: "svg",
    theme: 'dark',
    color: (item) => {
      if (item.type === 'YES') {
        return "#05c46b"
      } else if (item.type === 'NO') {
        return "#ff5e57"
      } else {
        return "#ffc048"
      }
    },
    tooltip: {
      customContent: (_, items) => {
        return <div style={{ padding: 5, textAlign: 'center' }}>Invested capital in {items[0]?.data.type} tokens:
          <div style={{ marginTop: 5 }}>{items[0]?.data.value} <small>{reserve_symbol}</small></div></div>
      }
    }
  }

  useEffect(() => {
    const data = [];

    candles.forEach(({ start_timestamp, yes_price, no_price, draw_price, supply_yes, supply_no, supply_draw, coef }) => {
      const date = moment.unix(start_timestamp).format(sevenDaysAlreadyPassed ? 'll' : 'lll');

      if (chartType === 'prices') {
        data.push(
          { date, value: yes_price, type: "YES", currencySymbol: reserve_symbol, chartType, symbol: yes_symbol },
          { date, value: no_price, type: "NO", currencySymbol: reserve_symbol, chartType, symbol: no_symbol }
        );

        if (allow_draw) {
          data.push({ date, value: draw_price, type: "DRAW", currencySymbol: reserve_symbol, chartType, symbol: draw_symbol })
        }
      } else if (chartType === 'fee') {
        data.push(
          { date, value: (coef - 1) * 100, chartType },
        );
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
  }, [candles, chartType, address, reservesRate]);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(moment.utc().unix()), 10000);

    return () => clearInterval(intervalId);
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [])

  useEffect(() => {
    const data = [
      { type: 'YES', token: 'yes', value: +Number((supply_yes * yesPrice) / 10 ** reserve_decimals).toFixed(reserve_decimals) },
      { type: 'NO', token: 'no', value: +Number((supply_no * noPrice) / 10 ** reserve_decimals).toFixed(reserve_decimals) },
    ];

    if (allow_draw) {
      data.push({ type: 'DRAW', token: 'draw', value: +Number((supply_yes * yesPrice) / 10 ** reserve_decimals).toFixed(reserve_decimals) });
    }

    setDataForPie(data)
  }, [stateVars, yesPrice, noPrice, drawPrice, supply_yes, supply_no, supply_draw]);

  if (params.end_of_trading_period > now) {
    tradeStatus = "TRADING"
    tradeStatusColor = '#05c46b'
    tradeTimerExpiry = params.end_of_trading_period;
    tradeIsActive = true;
    showCommitResultButton = false;
  } else if (result) {
    tradeStatus = "CLAIMING PROFIT";
    showClaimProfitButton = true;
    tradeStatusColor = '#05c46b';
  } else if (params.end_of_trading_period + params.waiting_period_length > now) {
    tradeStatus = "WAITING FOR RESULTS";
    tradeStatusColor = '#f39c12';
    tradeTimerExpiry = params.end_of_trading_period + params.waiting_period_length;
    showCommitResultButton = true;
  } else {
    tradeStatus = "RESUMED TRADING";
    tradeStatusColor = '#05c46b';
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
        {category}
      </Space>
      <h1 style={{ maxWidth: 800 }}>{event}</h1>
      <Space size='large' wrap={true} style={{ marginBottom: 15 }}>
        <TradeModal visible={visibleTradeModal} setVisible={setVisibleTradeModal} disabled={!tradeIsActive} />
        {showCommitResultButton && (datafeedValue ? <QRButton type="primary" size="large" href={commitResultLink}>Commit result</QRButton> : <Tooltip title="Oracle has not published results yet"><Button size="large" disabled={true}>Commit result</Button></Tooltip>)}
        {showClaimProfitButton && <ClaimProfitModal />}
        <ViewParamsModal {...params} aa_address={address} />
      </Space>

      <div className={styles.infoWrap}>
        <Row gutter={30}>
          <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard title="Yes price" subValue={yesPriceInUSD} color="#05c46b" onAction={(action) => setVisibleTradeModal({ type: 'yes', action })} value={<span>{yesPrice} <small>{reserve_symbol}</small></span>} />
          </Col>

          <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard title="No price" subValue={noPriceInUSD} color="#ff5e57" onAction={(action) => setVisibleTradeModal({ type: 'no', action })} value={<span>{noPrice} <small>{reserve_symbol}</small></span>} />
          </Col>

          {allow_draw && <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard title="Draw price" subValue={drawPriceInUSD} color="#ffc048" onAction={(action) => setVisibleTradeModal({ type: 'draw', action })} value={<span>{drawPrice} <small>{reserve_symbol}</small></span>} />
          </Col>}

          <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard title="Reserve" subValue={viewReserveInUSD} value={<span>{viewReserve} <small>{reserve_symbol}</small></span>} />
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
            <Radio.Button value="fee">Fee accumulation</Radio.Button>
          </Radio.Group>
        </div>
        <Line {...chartConfig} data={dataForChart} />
      </div>}

      {((supply_yes + supply_no + supply_draw) !== 0) && <div style={{ marginTop: 50 }}>
        <Row gutter={10} align="middle" justify="space-between">
          <Col md={{ span: 12 }} xs={{ span: 24 }}>
            <h2 style={{ fontSize: 28 }}>Make money from liquidity provision</h2>
            <Typography.Paragraph>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</Typography.Paragraph>
            <AddLiquidityModal disabled={!tradeIsActive} />
          </Col>

          <Col md={{ span: 8 }} xs={{ span: 24 }}>
            <div style={{ width: '100%' }}>
              <Pie data={dataForPie} {...pieConfig} />
            </div>
          </Col>
        </Row>
      </div>}

      <div>
        <h2 style={{ marginBottom: 15, marginTop: 50, fontSize: 28 }}>Recent events</h2>
        <RecentEvents data={recentEvents} />
      </div>
    </div>
  </Layout>
}