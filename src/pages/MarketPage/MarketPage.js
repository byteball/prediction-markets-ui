import { Row, Col, Space, Button, Radio, Spin, Tooltip, Typography } from "antd";
import { Layout } from "components/Layout/Layout";
import { StatsCard } from "components/StatsCard/StatsCard";
import { Line, Pie } from '@ant-design/plots';
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from 'moment';
import QRButton from "obyte-qr-button";
import Countdown from "antd/lib/statistic/Countdown";
import { Img } from 'react-image';

import { selectActiveDailyCandles, selectActiveDatafeedValue, selectActiveMarketParams, selectActiveMarketStateVars, selectActiveMarketStatus, selectActiveRecentEvents, selectActiveTeams } from "store/slices/activeSlice";
import { setActiveMarket } from "store/thunks/setActiveMarket";
import { selectPriceOrCoef, selectReserveAssets, selectReservesRate } from "store/slices/settingsSlice";
import { getMarketPriceByType, generateLink } from "utils";
import { RecentEvents } from "components/RecentEvents/RecentEvents";
import { AddLiquidityModal, ClaimProfitModal, ViewParamsModal, TradeModal } from "modals";

import styles from './MarketPage.module.css';
import appConfig from "appConfig";

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
    return type === 'NO' ? appConfig.NO_COLOR : type === 'YES' ? appConfig.YES_COLOR : appConfig.DRAW_COLOR;
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

  const candles = useSelector(selectActiveDailyCandles);
  const datafeedValue = useSelector(selectActiveDatafeedValue);
  const teams = useSelector(selectActiveTeams);

  const params = useSelector(selectActiveMarketParams);
  const recentEvents = useSelector(selectActiveRecentEvents);
  const priceOrCoef = useSelector(selectPriceOrCoef);

  const { event, reserve_asset = 'base', allow_draw, reserve_symbol, reserve_decimals, yes_decimals, no_decimals, draw_decimals, yes_symbol, no_symbol, draw_symbol, end_of_trading_period } = params;

  const actualReserveSymbol = reserveAssets[reserve_asset]?.symbol;

  const reservesRate = useSelector(selectReservesRate);

  const reserve_rate = reservesRate[reserve_asset];

  const { reserve = 0, result, supply_yes = 0, supply_no = 0, supply_draw = 0 } = stateVars;
  const viewReserve = +Number(reserve / 10 ** 9).toPrecision(5);
  const viewReserveInUSD = '$' + +Number((reserve / 10 ** reserve_decimals) * reserve_rate).toPrecision(2);

  const yesPrice = +getMarketPriceByType(stateVars, 'yes').toFixed(reserve_decimals);
  const noPrice = +getMarketPriceByType(stateVars, 'no').toFixed(reserve_decimals);
  const drawPrice = +getMarketPriceByType(stateVars, 'draw').toFixed(reserve_decimals);

  const yesPriceInUSD = +Number(yesPrice * reserve_rate).toPrecision(4);
  const noPriceInUSD = +Number(noPrice * reserve_rate).toPrecision(4);
  const drawPriceInUSD = +Number(drawPrice * reserve_rate).toPrecision(4);

  const isSportMarket = params.oracle === appConfig.SPORT_ORACLE;

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
      content: (item) => item.percent > 0.1 ? `${haveTeamNames ? (item.type === 'YES' ? teams.yes.name : (item.type === 'NO' ? teams.no.name : 'DRAW')) : item.type + ' tokens'}
      ${item.value} ${reserve_symbol}
      ${Number(item.percent * 100).toPrecision(4)}% 
      ` : '',
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
        return appConfig.YES_COLOR;
      } else if (item.type === 'NO') {
        return appConfig.NO_COLOR;
      } else {
        return appConfig.DRAW_COLOR
      }
    },
    tooltip: {
      customContent: (_, items) => {
        return <div style={{ padding: 5, textAlign: 'center' }}>Invested capital in {haveTeamNames ? (items[0]?.data.type === 'YES' ? teams.yes.name : (items[0]?.data.type === 'NO' ? teams.no.name : 'DRAW')) : items[0]?.data.type + ' tokens'}:
          <div style={{ marginTop: 5 }}>{items[0]?.data.value} <small>{reserve_symbol}</small></div></div>
      }
    },
    pieStyle: {
      stroke: "#141412",
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
      data.push({ type: 'DRAW', token: 'draw', value: +Number((supply_draw * drawPrice) / 10 ** reserve_decimals).toFixed(reserve_decimals) });
    }

    setDataForPie(data);
  }, [stateVars, yesPrice, noPrice, drawPrice, supply_yes, supply_no, supply_draw]);

  if (params.end_of_trading_period > now) {
    tradeStatus = "TRADING"
    tradeStatusColor = appConfig.YES_COLOR;
    tradeTimerExpiry = params.end_of_trading_period;
    tradeIsActive = true;
    showCommitResultButton = false;
  } else if (result) {
    tradeStatus = "CLAIMING PROFIT";
    showClaimProfitButton = true;
    tradeStatusColor = appConfig.YES_COLOR;
  } else if (params.end_of_trading_period + params.waiting_period_length > now) {
    tradeStatus = "WAITING FOR RESULTS";
    tradeStatusColor = '#f39c12';
    tradeTimerExpiry = params.end_of_trading_period + params.waiting_period_length;
    showCommitResultButton = true;
  } else {
    tradeStatus = "RESUMED TRADING";
    tradeStatusColor = appConfig.YES_COLOR
    tradeIsActive = true;
  }

  useEffect(() => {
    if (address) {
      dispatch(setActiveMarket(address))
    }
  }, [address]);

  if (status !== 'loaded' || !address || !actualReserveSymbol) return (<Layout> <div style={{ margin: 20, display: 'flex', justifyContent: 'center' }}><Spin size="large" /></div></Layout>)

  let yes_coef = 0;
  let draw_coef = 0;
  let no_coef = 0;

  if (reserve !== 0) {
    yes_coef = supply_yes !== 0 ? +Number((reserve / supply_yes) / yesPrice).toFixed(5) : null;
    no_coef = supply_no !== 0 ? +Number((reserve / supply_no) / noPrice).toFixed(5) : null;
    draw_coef = supply_draw !== 0 ? +Number((reserve / supply_draw) / drawPrice).toFixed(5) : null;
  }

  const haveTeamNames = isSportMarket && teams?.yes?.name && teams?.no?.name;

  return <Layout>
    <div style={{ marginTop: 50 }}>
      {(teams.yes === null || teams.no === null) ? <h1 style={{ maxWidth: 800 }}>{event}</h1> : <div style={{ margin: '30px 0', width: '100%' }}>
        <Row align="middle">
          <Col md={{ span: 8 }} xs={{ span: 8 }} style={{ textAlign: 'center' }}>
            <Img src={[`https://crests.football-data.org/${teams.yes.id}.png`, `https://crests.football-data.org/${teams.yes.id}.svg`]} width={'50%'} style={{ maxWidth: 120 }} />
            <div style={{ paddingTop: 10, lineHeight: 1 }}>
              <span style={{ color: appConfig.YES_COLOR }}>{teams.yes.name}</span>
            </div>
          </Col>

          <Col md={{ span: 8 }} xs={{ span: 8 }} style={{ textAlign: 'center' }}>
            <b style={{ fontSize: 36 }}>VS</b>
            <div>
              {moment.unix(end_of_trading_period).format('ll')}
            </div>
          </Col>

          <Col md={{ span: 8 }} xs={{ span: 8 }} style={{ textAlign: 'center' }}>
            <Img
              src={[`https://crests.football-data.org/${teams.no.id}.png`, `https://crests.football-data.org/${teams.no.id}.svg`]}
              width={'50%'}
              style={{ maxWidth: 120 }}
            />
            <div style={{ paddingTop: 10, lineHeight: 1 }}>
              <span style={{ color: appConfig.NO_COLOR }}>{teams.no.name}</span>
            </div>
          </Col>
        </Row>
      </div>}

      <Row justify="space-between" align="middle">
        <Space size='large' wrap={true} style={{ marginBottom: 15 }}>
          <TradeModal
            visible={visibleTradeModal}
            setVisible={setVisibleTradeModal}
            disabled={!tradeIsActive}
            yes_team={teams?.yes?.name}
            no_team={teams?.no?.name}
          />
          {showCommitResultButton && (datafeedValue ? <QRButton type="primary" size="large" href={commitResultLink}>Commit result</QRButton> : <Tooltip title="Oracle has not published results yet"><Button size="large" disabled={true}>Commit result</Button></Tooltip>)}
          {showClaimProfitButton && <ClaimProfitModal />}
          <ViewParamsModal {...params} aa_address={address} />
        </Space>
      </Row>

      <div className={styles.infoWrap}>
        <Row gutter={30}>
          <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard
              title={`${haveTeamNames ? teams.yes.name : 'Yes'} ${priceOrCoef}`}
              subValue={priceOrCoef === 'price' ? `$${yesPriceInUSD}` : (yesPriceInUSD && yes_coef ? `$${+Number(yesPriceInUSD * yes_coef).toFixed(2)}` : '-')} color={appConfig.YES_COLOR} onAction={tradeIsActive ? (action) => setVisibleTradeModal({ type: 'yes', action }) : undefined}
              value={priceOrCoef === 'price' ? <span>{yesPrice} <small>{reserve_symbol}</small></span> : (yes_coef ? <span>x{yes_coef}</span> : '-')} />
          </Col>

          <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard
              title={`${haveTeamNames ? teams.no.name : 'No'} ${priceOrCoef}`}
              subValue={priceOrCoef === 'price' ? `$${noPriceInUSD}` : (noPriceInUSD && no_coef ? `$${+Number(noPriceInUSD * no_coef).toFixed(2)}` : '-')} color={appConfig.NO_COLOR} onAction={tradeIsActive ? (action) => setVisibleTradeModal({ type: 'no', action }) : undefined}
              value={priceOrCoef === 'price' ? <span>{noPrice} <small>{reserve_symbol}</small></span> : (no_coef ? <span>x{no_coef}</span> : '-')} />
          </Col>

          {allow_draw && <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard
              title={`Draw ${isSportMarket ? priceOrCoef : 'price'}`} s
              subValue={priceOrCoef === 'price' ? `$${drawPriceInUSD}` : (drawPriceInUSD && draw_coef ? `$${+Number(drawPriceInUSD * draw_coef).toFixed(2)}` : '-')} color={appConfig.DRAW_COLOR} onAction={tradeIsActive ? (action) => setVisibleTradeModal({ type: 'draw', action }) : undefined} value={priceOrCoef === 'price' || !isSportMarket ? <span>{drawPrice} <small>{reserve_symbol}</small></span> : (draw_coef ? <span>x{draw_coef}</span> : '-')} />
          </Col>}

          <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard
              title="Reserve"
              subValue={viewReserveInUSD}
              value={<span>{viewReserve} <small>{reserve_symbol}</small></span>} />
          </Col>

          <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard
              title="time to expiration" showChart={false}
              value={tradeTimerExpiry ? <Countdown
                value={moment.unix(tradeTimerExpiry)}
                format="DD [days] HH:mm:ss" /> : '-'}
              subValue={<span>STATUS: <span style={{ color: tradeStatusColor, textTransform: 'uppercase' }}>{tradeStatus}</span></span>} />
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

      <div style={{ marginTop: 50 }}>
        <Row gutter={10} align="middle" justify="space-between">
          <Col md={{ span: 12 }} xs={{ span: 24 }}>
            <h2 style={{ fontSize: 28 }}>Make money from liquidity provision</h2>
            <Typography.Paragraph>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</Typography.Paragraph>
            <AddLiquidityModal disabled={!tradeIsActive} yes_team={teams?.yes?.name} no_team={teams?.no?.name} />
          </Col>

          <Col md={{ span: 8 }} xs={{ span: 24 }}>
            {(supply_yes + supply_no + supply_draw) !== 0 && <div style={{ width: '100%' }}>
              <Pie data={dataForPie} {...pieConfig} />
            </div>}
          </Col>
        </Row>
      </div>

      <div>
        <h2 style={{ marginBottom: 15, marginTop: 50, fontSize: 28 }}>Recent events</h2>
        <RecentEvents data={recentEvents} />
      </div>

    </div>
  </Layout>
}