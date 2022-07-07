import { Row, Col, Space, Button, Radio, Spin, Tooltip, Typography } from "antd";
import { Layout } from "components/Layout/Layout";
import { StatsCard } from "components/StatsCard/StatsCard";
import { Line } from '@ant-design/plots';
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from 'moment';
import QRButton from "obyte-qr-button";
import Countdown from "antd/lib/statistic/Countdown";
import { Img } from 'react-image';

import { selectActiveCurrencyCandles, selectActiveCurrencyCurrentValue, selectActiveDailyCandles, selectActiveDatafeedValue, selectActiveMarketParams, selectActiveMarketStateVars, selectActiveMarketStatus, selectActiveRecentEvents, selectActiveTeams } from "store/slices/activeSlice";
import { setActiveMarket } from "store/thunks/setActiveMarket";
import { selectPriceOrCoef, selectReserveAssets, selectReservesRate } from "store/slices/settingsSlice";
import { getMarketPriceByType, generateLink, generateTextEvent } from "utils";
import { RecentEvents } from "components/RecentEvents/RecentEvents";
import { CurrencyChart } from "components/CurrencyChart/CurrencyChart";
import { MarketSizePie } from "components/MarketSizePie/MarketSizePie";
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
  const [visibleTradeModal, setVisibleTradeModal] = useState(false);
  const [dataForChart, setDataForChart] = useState([]);

  const status = useSelector(selectActiveMarketStatus);
  const reserveAssets = useSelector(selectReserveAssets);
  const stateVars = useSelector(selectActiveMarketStateVars);

  const candles = useSelector(selectActiveDailyCandles);
  const datafeedValue = useSelector(selectActiveDatafeedValue);

  const teams = useSelector(selectActiveTeams);
  const currencyCandles = useSelector(selectActiveCurrencyCandles);
  const currencyCurrentValue = useSelector(selectActiveCurrencyCurrentValue);

  const params = useSelector(selectActiveMarketParams);
  const recentEvents = useSelector(selectActiveRecentEvents);
  const priceOrCoef = useSelector(selectPriceOrCoef);

  const { reserve_asset = 'base', allow_draw, reserve_symbol, reserve_decimals, yes_decimals, no_decimals, draw_decimals, yes_symbol, no_symbol, draw_symbol, end_of_trading_period, league, league_emblem, created_at } = params;

  const actualReserveSymbol = reserveAssets[reserve_asset]?.symbol;

  const reservesRate = useSelector(selectReservesRate);

  const reserve_rate = reservesRate[reserve_asset];

  const event = generateTextEvent(params);

  const { reserve = 0, result, supply_yes = 0, supply_no = 0, supply_draw = 0, coef = 1 } = stateVars;
  const viewReserve = +Number(reserve / 10 ** 9).toPrecision(5);
  const viewReserveInUSD = '$' + +Number((reserve / 10 ** reserve_decimals) * reserve_rate).toPrecision(2);

  const yesPrice = +getMarketPriceByType(stateVars, 'yes').toFixed(reserve_decimals);
  const noPrice = +getMarketPriceByType(stateVars, 'no').toFixed(reserve_decimals);
  const drawPrice = +getMarketPriceByType(stateVars, 'draw').toFixed(reserve_decimals);

  const yesPriceInUSD = +Number(yesPrice * reserve_rate).toPrecision(4);
  const noPriceInUSD = +Number(noPrice * reserve_rate).toPrecision(4);
  const drawPriceInUSD = +Number(drawPrice * reserve_rate).toPrecision(4);

  const isSportMarket = !!appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === params.oracle);
  const isCurrencyMarket = !!appConfig.CATEGORIES.currency.oracles.find(({ address }) => address === params.oracle);

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
    let candlesData = candles;

    const data = [];

    if (candlesData.length === 1) {
      candlesData = [candles[0], { ...candlesData[0], start_timestamp: candlesData[0].start_timestamp - 3600 }];
    }

    candlesData.forEach(({ start_timestamp, yes_price, no_price, draw_price, supply_yes, supply_no, supply_draw, coef }) => {
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

  const elapsed_seconds = moment.utc().unix() - created_at;
  const apy = Number(((coef * (1 - params.issue_fee)) ** (31536000 / elapsed_seconds) - 1) * 100).toFixed(2);

  let yesTooltip = '';
  let noTooltip = '';
  let drawTooltip = '';

  if (haveTeamNames) {
    const yes_team_name = teams.yes.name;
    const no_team_name = teams.no.name;

    if (priceOrCoef === 'price') {
      yesTooltip = `The price of the ${yes_team_name} token. If ${yes_team_name} wins, all funds paid by buyers of all tokens will be divided among ${yes_team_name} token holders.`;
      noTooltip = `The price of the ${no_team_name} token. If ${no_team_name} wins, all funds paid by buyers of all tokens will be divided among ${no_team_name} token holders.`;
      drawTooltip = `The price of the draw token. If will be draw, all funds paid by buyers of all tokens will be divided among draw token holders.`;
    } else {
      yesTooltip = `The multiple you receive if you bet on ${yes_team_name} and it wins, assuming the odds don’t change.`;
      noTooltip = `The multiple you receive if you bet on ${no_team_name} and it wins, assuming the odds don’t change.`;
      drawTooltip = "The multiple you receive if you bet on draw and your bet wins, assuming the odds don’t change.";
    }

  } else {
    if (priceOrCoef === 'price') {
      yesTooltip = "The price of the token that represents the “Yes” outcome. If this outcome wins, all funds paid by buyers of all tokens will be divided among “Yes” token holders.";
      noTooltip = "The price of the token that represents the “No” outcome. If this outcome wins, all funds paid by buyers of all tokens will be divided among “No” token holders.";
      drawTooltip = "The price of the token that represents the “Draw” outcome. If this outcome wins, all funds paid by buyers of all tokens will be divided among “Draw” token holders.";
    } else {
      yesTooltip = "The multiple you receive if you bet on “Yes” outcome and it wins, assuming the odds don’t change.";
      noTooltip = "The multiple you receive if you bet on “Yes” outcome and it wins, assuming the odds don’t change.";
      drawTooltip = "The multiple you receive if you bet on “Draw” outcome and it wins, assuming the odds don’t change.";
    }
  }

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
            <b className={styles.vs}>VS</b>
            <div>
              {moment.unix(end_of_trading_period).format('lll')}
            </div>
            {league && league_emblem && <div><Tooltip title={league}><img className={styles.league} src={league_emblem} alt={league} /></Tooltip></div>}
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

      {isCurrencyMarket && currencyCandles.length > 0 && <CurrencyChart data={currencyCandles} params={params} />}

      <div className={styles.infoWrap}>
        <Row gutter={30}>
          <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard
              title={`${haveTeamNames ? teams.yes.name : 'Yes'}`}
              tooltip={yesTooltip}
              subValue={priceOrCoef === 'price' ? `$${yesPriceInUSD}` : ''} color={appConfig.YES_COLOR} onAction={tradeIsActive ? (action) => setVisibleTradeModal({ type: 'yes', action }) : undefined}
              value={priceOrCoef === 'price' ? <span>{yesPrice} <small>{reserve_symbol}</small></span> : (yes_coef ? <span>x{yes_coef}</span> : '-')} />
          </Col>

          <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard
              title={`${haveTeamNames ? teams.no.name : 'No'}`}
              tooltip={noTooltip}
              subValue={priceOrCoef === 'price' ? `$${noPriceInUSD}` : ''} color={appConfig.NO_COLOR} onAction={tradeIsActive ? (action) => setVisibleTradeModal({ type: 'no', action }) : undefined}
              value={priceOrCoef === 'price' ? <span>{noPrice} <small>{reserve_symbol}</small></span> : (no_coef ? <span>x{no_coef}</span> : '-')} />
          </Col>

          {allow_draw && <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard
              title="Draw"
              tooltip={drawTooltip}
              subValue={priceOrCoef === 'price' ? `$${drawPriceInUSD}` : ''} color={appConfig.DRAW_COLOR} onAction={tradeIsActive ? (action) => setVisibleTradeModal({ type: 'draw', action }) : undefined}
              value={priceOrCoef === 'price' ? <span>{drawPrice} <small>{reserve_symbol}</small></span> : (draw_coef ? <span>x{draw_coef}</span> : '-')} />
          </Col>}

          <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard
              title="Reserve"
              subValue={viewReserveInUSD}
              tooltip="Total amount invested in all outcomes"
              value={<span>{viewReserve} <small>{reserve_symbol}</small></span>} />
          </Col>

          {isCurrencyMarket && currencyCurrentValue && <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard
              title="Current value"
              tooltip={`The latest value of the data feed ${params.feed_name}`}
              value={+currencyCurrentValue.toFixed(9)} />
          </Col>}

          <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard
              title="time to expiration"
              tooltip="The period while you can make your bets, or exit them if you changed your mind"
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
          <Col md={{ span: reserve !== 0 ? 12 : 24 }} xs={{ span: 24 }}>
            <h2 style={{ fontSize: 28 }}>Make money from liquidity provision</h2>
            <Typography.Paragraph>
              {reserve !== 0 && <span>Every trade is charged a fee which is added to the market’s pool (see the fee accumulation chart above).</span>} Earn a share of these fees by buying all tokens in the same proportions they are already issued. One of the tokens will win, and you’ll get a share of the trading fees collected after you invested.
            </Typography.Paragraph>
            <Typography.Paragraph>
              By buying all tokens without changing their proportions you are not betting on any outcome but taking a market-neutral position instead and adding liquidity to the market. This is safe if the current proportions reflect the true probabilities.
            </Typography.Paragraph>
            <Typography.Paragraph>
              <b>Liquidity provision APY since the pool was started: {+apy}%</b>

            </Typography.Paragraph>
            <AddLiquidityModal disabled={!tradeIsActive} yes_team={teams?.yes?.name} no_team={teams?.no?.name} />
          </Col>

          {reserve !== 0 && <Col md={{ span: 8 }} xs={{ span: 24 }}>
            <div style={{ width: '100%' }}>
              <MarketSizePie
                teams={teams}
                reserve_decimals={reserve_decimals}
                stateVars={stateVars}
                reserve_symbol={reserve_symbol}
                allow_draw={allow_draw}
                oracle={params.oracle}
              />
            </div>
          </Col>}
        </Row>
      </div>

      <div>
        <h2 style={{ marginBottom: 15, marginTop: 50, fontSize: 28 }}>Recent events</h2>
        <RecentEvents data={recentEvents} />
      </div>

    </div>
  </Layout>
}