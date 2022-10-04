import { Row, Col, Space, Button, Radio, Spin, Tooltip, Typography, Alert } from "antd";
import { Layout } from "components/Layout/Layout";
import { StatsCard } from "components/StatsCard/StatsCard";
import { Line } from '@ant-design/plots';
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from 'moment';
import QRButton from "obyte-qr-button";
import Countdown from "antd/lib/statistic/Countdown";
import { Img } from 'react-image';
import { Helmet } from "react-helmet-async";
import { kebabCase } from "lodash";
import { Trans, useTranslation } from "react-i18next";

import {
  selectActiveCurrencyCandles,
  selectActiveCurrencyCurrentValue,
  selectActiveDailyCandles,
  selectActiveDatafeedValue,
  selectActiveMarketParams,
  selectActiveMarketStateVars,
  selectActiveMarketStatus,
  selectActiveTeams
} from "store/slices/activeSlice";
import { setActiveMarket } from "store/thunks/setActiveMarket";
import { selectPriceOrOdds, selectReserveAssets, selectReservesRate } from "store/slices/settingsSlice";
import { getMarketPriceByType, generateLink, generateTextEvent, getEstimatedAPY, transformChampionshipName } from "utils";
import { RecentEvents } from "components/RecentEvents/RecentEvents";
import { CurrencyChart } from "components/CurrencyChart/CurrencyChart";
import { MarketSizePie } from "components/MarketSizePie/MarketSizePie";
import { AddLiquidityModal, ClaimProfitModal, ViewParamsModal, TradeModal } from "modals";

import styles from './MarketPage.module.css';
import appConfig from "appConfig";

const SECONDS_IN_YEAR = 31536000;

const getConfig = (chartType, teams) => ({
  xField: 'date',
  yField: 'value',
  seriesField: 'type',
  autoFit: true,
  animation: false,
  renderer: 'svg',
  smooth: true,
  appendPadding: 5,
  theme: 'dark',
  map: {
    style: 'dark',
  },
  color: ({ type }) => {
    if (chartType === 'apy') return appConfig.YES_COLOR;

    return (type === 'NO' || type === teams?.no?.name) ? appConfig.NO_COLOR : (type === 'YES' || type === teams?.yes?.name) ? appConfig.YES_COLOR : appConfig.DRAW_COLOR;
  },
  yAxis: {
    label: {
      formatter: (v) => {
        if (chartType === 'fee' || chartType === 'apy') {
          return `${v}%`;
        } else {
          return v;
        }
      }
    }
  },
  tooltip: {
    customContent: (title, items) => {
      return (
        <>
          <p style={{ marginTop: 16 }}>{title}</p>
          <ul style={{ paddingLeft: 0 }}>
            {items?.map((item, index) => {
              const { color, data: { currencySymbol, chartType, value, symbol, type, date } } = item;
              const valueView = (chartType === 'fee' || chartType === 'apy') ? `${Number(value) > 1e15 ? value.toPrecision(9) : (+Number(value).toPrecision(9)).toLocaleString('en-US')}%` : `${+value.toPrecision(9)} ${currencySymbol}`;

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
});

export const MarketPage = () => {
  const location = useLocation();
  let address;

  const regex = /(\w{32})$/;
  const match = location.pathname.match(regex);

  if (match) {
    address = match[0];
  }

  const dispatch = useDispatch();
  const { t } = useTranslation();

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

  const priceOrOdds = useSelector(selectPriceOrOdds);

  const chartConfig = getConfig(chartType, teams);

  const { reserve_asset = 'base', allow_draw, quiet_period = 0, reserve_symbol, reserve_decimals, yes_decimals, no_decimals, draw_decimals, yes_symbol, no_symbol, draw_symbol, event_date, league, league_emblem, created_at, committed_at, oracle, base_aa, issue_fee, first_trade_ts, yes_odds = null, no_odds = null, draw_odds = null } = params;

  const actualReserveSymbol = reserveAssets[reserve_asset]?.symbol;

  const reservesRate = useSelector(selectReservesRate);

  const reserve_rate = reservesRate[reserve_asset] || 0;

  const event = generateTextEvent({ ...params, yes_team_name: teams?.yes?.name, no_team_name: teams?.no?.name });
  const eventUTC = generateTextEvent({ ...params, yes_team_name: teams?.yes?.name, no_team_name: teams?.no?.name, isUTC: true });

  const { reserve = 0, result, supply_yes = 0, supply_no = 0, supply_draw = 0, coef = 1 } = stateVars;
  const viewReserve = +Number(reserve / 10 ** reserve_decimals).toPrecision(5);
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
  const sevenDaysAlreadyPassed = now > (params.event_date + 3600 * 24 * 7);

  const commitResultLink = generateLink({ aa: address, amount: 1e4, data: { commit: 1 } });

  useEffect(() => {
    let candlesData = candles;

    const data = [];

    if (candlesData.length === 1 && chartType !== 'apy') {
      candlesData = [candles[0], { ...candlesData[0], start_timestamp: candlesData[0].start_timestamp - 3600 }];
    }

    if (candlesData.length > 0 && chartType === 'fee') {
      data.push({ date: moment.unix(created_at).format(sevenDaysAlreadyPassed ? 'll' : 'lll'), value: 0, chartType });
    }

    const last_close_ts = committed_at ? committed_at : candlesData[candlesData.length - 1]?.start_timestamp;
    const needsIssueFeeForLiquidity = appConfig.BASE_AAS.findIndex((address) => address === base_aa) === 0;

    let coef_end;

    const first_trade_at = first_trade_ts || created_at;

    if (result) {
      coef_end = coef * (1 - (needsIssueFeeForLiquidity ? issue_fee : 0));
    } else {
      coef_end = (coef * (1 - (needsIssueFeeForLiquidity ? issue_fee : 0))) ** (((committed_at || event_date) - first_trade_at) / (last_close_ts - first_trade_at));
    }

    candlesData.forEach(({ start_timestamp: open_ts, open_yes_price: yes_price, open_no_price: no_price, open_draw_price: draw_price, open_supply_yes: supply_yes, open_supply_no: supply_no, open_supply_draw: supply_draw, open_coef }, index) => {
      const date = moment.unix(open_ts).format((committed_at || now) > ((first_trade_ts || created_at) + 3600 * 24 * 30) ? 'll' : 'lll');

      if (chartType === 'prices') {
        data.push(
          { date, value: yes_price, type: teams?.yes?.name || "YES", currencySymbol: reserve_symbol, chartType, symbol: yes_symbol },
          { date, value: no_price, type: teams?.no?.name || "NO", currencySymbol: reserve_symbol, chartType, symbol: no_symbol }
        );

        if (allow_draw) {
          data.push({ date, value: draw_price, type: "DRAW", currencySymbol: reserve_symbol, chartType, symbol: draw_symbol })
        }
      } else if (chartType === 'fee') {
        data.push(
          { date, value: (open_coef - 1) * 100, chartType },
        );
      } else if (chartType === 'apy') {

        const capitalGain = coef_end / (open_coef * (1 - (needsIssueFeeForLiquidity ? issue_fee : 0)));

        const time_left = (committed_at || event_date) - open_ts;

        const apy = (capitalGain ** (SECONDS_IN_YEAR / time_left) - 1) * 100;

        data.push({ date, value: apy, chartType });
      } else {
        data.push(
          { date, value: +Number(supply_yes / 10 ** yes_decimals).toFixed(yes_decimals), type: teams?.yes?.name || "YES", currencySymbol: yes_symbol, chartType },
          { date, value: +Number(supply_no / 10 ** no_decimals).toFixed(no_decimals), type: teams?.no?.name || "NO", currencySymbol: no_symbol, chartType }
        );

        if (allow_draw) {
          data.push({ date, value: +Number(supply_draw / 10 ** draw_decimals).toFixed(draw_decimals), type: "DRAW", currencySymbol: draw_symbol, chartType },)
        }
      }
    });

    setDataForChart(data);
  }, [candles, chartType, address, reservesRate, teams]);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(moment.utc().unix()), 10000);

    return () => clearInterval(intervalId);
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (params.event_date - quiet_period > now) {
    tradeStatus = t("common.status.trading", 'trading').toUpperCase();
    tradeStatusColor = appConfig.YES_COLOR;
    tradeTimerExpiry = params.event_date;
    tradeIsActive = true;
    showCommitResultButton = false;
  } else if (params.event_date > now) {
    tradeStatus = t("common.status.quiet_period", 'quiet period').toUpperCase();
    tradeStatusColor = '#e58e26';
  } else if (result) {
    tradeStatus = t("common.status.claiming", 'Claiming profit').toUpperCase();
    showClaimProfitButton = true;
    tradeStatusColor = appConfig.YES_COLOR;
  } else if (params.event_date + params.waiting_period_length > now) {
    tradeStatus = t("common.status.waiting", 'Waiting for results').toUpperCase();
    tradeStatusColor = '#e58e26';
    tradeTimerExpiry = params.event_date + params.waiting_period_length;
    showCommitResultButton = true;
  } else {
    tradeStatus = t("common.status.resumed", "Resumed trading").toUpperCase();
    tradeStatusColor = appConfig.YES_COLOR;
    showCommitResultButton = true;
    tradeIsActive = true;
  }

  useEffect(() => {
    if (address) {
      dispatch(setActiveMarket(address))
    }
  }, [address]);

  if (status !== 'loaded' || !address || !actualReserveSymbol) return (<Layout> <div style={{ margin: 20, display: 'flex', justifyContent: 'center' }}><Spin size="large" /></div></Layout>)

  // calc odds
  let yesOddsView = 0;
  let drawOddsView = 0;
  let noOddsView = 0;

  if (reserve !== 0) {
    yesOddsView = supply_yes !== 0 ? +Number((reserve / supply_yes) / yesPrice).toFixed(5) : null;
    drawOddsView = supply_draw !== 0 ? +Number((reserve / supply_draw) / drawPrice).toFixed(5) : null;
    noOddsView = supply_no !== 0 ? +Number((reserve / supply_no) / noPrice).toFixed(5) : null;
  }

  const haveTeamNames = isSportMarket && teams?.yes?.name && teams?.no?.name;

  const apy = getEstimatedAPY({ coef, params });
  const apyView = apy < 1e15 ? (+Number(apy).toPrecision(9)).toLocaleString('en-US') : apy;

  let yesTooltip = '';
  let noTooltip = '';
  let drawTooltip = '';

  if (haveTeamNames) {
    const yes_team_name = teams.yes.name;
    const no_team_name = teams.no.name;

    if (priceOrOdds === 'price') {
      yesTooltip = t('pages.market.sport_price_tooltip', 'The price of the {{team_name}} token. If {{team_name}} wins, all funds paid by buyers of all tokens will be divided among {{team_name}} token holders.', { team_name: yes_team_name })
      yesTooltip = t('pages.market.sport_price_tooltip', 'The price of the {{team_name}} token. If {{team_name}} wins, all funds paid by buyers of all tokens will be divided among {{team_name}} token holders.', { team_name: no_team_name })
      drawTooltip = t('pages.market.sport_price_tooltip_draw', 'The price of the draw token. In case of a draw, all funds paid by buyers of all tokens will be divided among draw token holders.');
    } else {
      yesTooltip = t('pages.market.sport_odds_tooltip', 'The multiple you receive if you bet on {{team_name}} and it wins, assuming the odds don’t change.', { team_name: yes_team_name });
      noTooltip = t('pages.market.sport_odds_tooltip', 'The multiple you receive if you bet on {{team_name}} and it wins, assuming the odds don’t change.', { team_name: no_team_name });
      drawTooltip = t('pages.market.sport_odds_tooltip_draw', "The multiple you receive if you bet on draw and your bet wins, assuming the odds don’t change.");
    }

  } else {
    if (priceOrOdds === 'price') {
      yesTooltip = t('pages.market.price_tooltip', "The price of the token that represents the “{{type}}” outcome. If this outcome wins, all funds paid by buyers of all tokens will be divided among “{{type}}” token holders.", { type: "Yes" });
      noTooltip = t('pages.market.price_tooltip', "The price of the token that represents the “{{type}}” outcome. If this outcome wins, all funds paid by buyers of all tokens will be divided among “{{type}}” token holders.", { type: "No" });
      drawTooltip = t('pages.market.price_tooltip', "The price of the token that represents the “{{type}}” outcome. If this outcome wins, all funds paid by buyers of all tokens will be divided among “{{type}}” token holders.", { type: "Draw" });
    } else {
      yesTooltip = t('pages.market.odds_tooltip', "The multiple you receive if you bet on “{{type}}” outcome and it wins, assuming the odds don’t change.", { type: "Yes" });
      noTooltip = t('pages.market.odds_tooltip', "The multiple you receive if you bet on “{{type}}” outcome and it wins, assuming the odds don’t change.", { type: "No" });
      drawTooltip = t('pages.market.odds_tooltip', "The multiple you receive if you bet on “{{type}}” outcome and it wins, assuming the odds don’t change.", { type: "Draw" });
    }
  }

  let winnerPriceView = 0;
  let winnerOddsView = 0;

  if (result && reserve) {
    const winnerSupply = result === 'yes' ? supply_yes : (result === 'no' ? supply_no : supply_draw);

    if (winnerSupply) {
      winnerPriceView = +Number(reserve / winnerSupply).toPrecision(5);
      winnerOddsView = +Number(reserve / winnerSupply).toPrecision(5);
    }
  }

  let yesSubValueView = '';
  let noSubValueView = '';
  let drawSubValueView = '';

  if (priceOrOdds === 'price' && reserve_rate) {
    yesSubValueView = `$${yesPriceInUSD}`;
    noSubValueView = `$${noPriceInUSD}`;
    if (allow_draw) {
      drawSubValueView = `$${drawPriceInUSD}`;
    }
  } else if (priceOrOdds === 'odds' && yes_odds && no_odds && draw_odds && yesOddsView && noOddsView && drawOddsView) {
    yesSubValueView = t('pages.market.bookmaker_odds', `Bookmaker odds: x{{odds}}`, { odds: yes_odds });
    noSubValueView = t('pages.market.bookmaker_odds', `Bookmaker odds: x{{odds}}`, { odds: no_odds });
    drawSubValueView = t('pages.market.bookmaker_odds', `Bookmaker odds: x{{odds}}`, { odds: draw_odds });
  }


  const showMarketSizePie = !result && reserve !== 0;

  const seoText = kebabCase(eventUTC);
  const leagueView = transformChampionshipName(league, params.feed_name.split('_')?.[0])

  return <Layout>
    <Helmet>
      <title>Prophet prediction markets — {((teams.yes === null || teams.no === null) ? event : `${teams.yes.name} vs ${teams.no.name}`) + `, liquidity provider APY ${apy}%`}</title>
      <link rel="canonical" href={`${window.location.protocol + '//' + window.location.host}/market/${seoText}-${address}`} />
    </Helmet>
    <div style={{ marginTop: 50 }}>
      <h1 className={styles.event} style={{ maxWidth: 860 }}>{event}</h1>
      {(teams.yes === null || teams.no === null) ? null : <div style={{ margin: '30px 0', width: '100%' }}>
        <Row align="middle">
          <Col md={{ span: 8 }} xs={{ span: 8 }} style={{ textAlign: 'center' }}>
            <Img src={[`https://crests.football-data.org/${teams.yes.id}.svg`, `https://crests.football-data.org/${teams.yes.id}.png`]} width={'50%'} style={{ maxWidth: 120 }} />
            <div style={{ paddingTop: 10, lineHeight: 1 }}>
              <span style={{ color: appConfig.YES_COLOR }}>{teams.yes.name}</span>
            </div>
          </Col>

          <Col md={{ span: 8 }} xs={{ span: 8 }} style={{ textAlign: 'center' }}>
            <b className={styles.vs}>VS</b>
            <div>
              {moment.unix(event_date).format('MMM D, h:mm A')}
            </div>
            {league && league_emblem && <div><Tooltip title={leagueView}><img className={styles.league} src={league_emblem} alt={leagueView} /></Tooltip></div>}
          </Col>

          <Col md={{ span: 8 }} xs={{ span: 8 }} style={{ textAlign: 'center' }}>
            <Img
              src={[`https://crests.football-data.org/${teams.no.id}.svg`, `https://crests.football-data.org/${teams.no.id}.png`]}
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
        <Space size='large' wrap={true} style={{ marginBottom: 20 }}>
          <TradeModal
            visible={visibleTradeModal}
            setVisible={setVisibleTradeModal}
            disabled={!tradeIsActive}
            reserve={reserve}
            yes_team={teams?.yes?.name}
            no_team={teams?.no?.name}
          />
          {showCommitResultButton && (datafeedValue ? <QRButton type="primary" size="large" href={commitResultLink}>{t('pages.market.commit_result', "Commit result")}</QRButton> : <Tooltip title={t('pages.market.not_published', "Oracle has not published results yet")}><Button size="large" disabled={true}>{t('pages.market.commit_result', "Commit result")}</Button></Tooltip>)}
          {showClaimProfitButton && <ClaimProfitModal
            yes_team={teams?.yes?.name}
            no_team={teams?.no?.name}
          />}
          <ViewParamsModal {...params} aa_address={address} />
        </Space>
      </Row>

      {!appConfig.KNOWN_ORACLES.includes(oracle) && <Alert showIcon message={<Trans i18nKey="pages.market.unknown_oracle">This market uses an oracle <a style={{ color: '#fff' }} href={`https://${appConfig.ENVIRONMENT === 'testnet' ? 'testnet' : ''}explorer.obyte.org/#${oracle}`} target="_blank" rel="noopener">{oracle}</a> that is unknown to this website, trade with care.</Trans>} type="warning" />}

      {isCurrencyMarket && currencyCandles.length > 0 && <CurrencyChart data={currencyCandles} params={params} />}

      <div className={styles.infoWrap}>
        <Row gutter={30}>
          <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard
              title={`${haveTeamNames ? teams.yes.name : t('common.yes', 'yes')}`}
              tooltip={yesTooltip}
              reserve={reserve}
              isWinner={result ? result === 'yes' : undefined}
              subValue={yesSubValueView}
              color={appConfig.YES_COLOR}
              onAction={tradeIsActive ? (action) => setVisibleTradeModal({ type: 'yes', action }) : undefined}
              value={priceOrOdds === 'price' ? <span>{result ? winnerPriceView : yesPrice} <small>{reserve_symbol}</small></span> : (yesOddsView ? <span>x{result ? winnerOddsView : yesOddsView}</span> : '-')} />
          </Col>

          {allow_draw ? <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard
              title={t('common.draw', 'draw')}
              tooltip={drawTooltip}
              reserve={reserve}
              isWinner={result ? result === 'draw' : undefined}
              subValue={drawSubValueView}
              color={appConfig.DRAW_COLOR}
              onAction={tradeIsActive ? (action) => setVisibleTradeModal({ type: 'draw', action }) : undefined}
              value={priceOrOdds === 'price' ? <span>{result ? winnerPriceView : drawPrice} <small>{reserve_symbol}</small></span> : (drawOddsView ? <span>x{result ? winnerOddsView : drawOddsView}</span> : '-')} />
          </Col> : null}

          <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard
              title={`${haveTeamNames ? teams.no.name : t('common.no', 'no')}`}
              tooltip={noTooltip}
              reserve={reserve}
              isWinner={result ? result === 'no' : undefined}
              subValue={noSubValueView}
              color={appConfig.NO_COLOR}
              onAction={tradeIsActive ? (action) => setVisibleTradeModal({ type: 'no', action }) : undefined}
              value={priceOrOdds === 'price' ? <span>{result ? winnerPriceView : noPrice} <small>{reserve_symbol}</small></span> : (noOddsView ? <span>x{result ? winnerOddsView : noOddsView}</span> : '-')} />
          </Col>

          {(isCurrencyMarket && currencyCurrentValue) ? <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard
              title={t('pages.market.cards.current.title', "Current value")}
              tooltip={t('pages.market.cards.current.desc', "The latest value of the data feed {{feed_name}}", { feed_name: params.feed_name })}
              value={+currencyCurrentValue.toFixed(9)} />
          </Col> : null}

          <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard
              title={t('pages.market.cards.reserve.title', "Reserve")}
              subValue={reserve_rate ? viewReserveInUSD : undefined}
              tooltip={t('pages.market.cards.reserve.desc', "Total amount invested in all outcomes")}
              value={<span>{viewReserve} <small>{reserve_symbol}</small></span>} />
          </Col>

          <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
            <StatsCard
              title={t('pages.market.cards.expiration_time.title', "time to expiration")}
              tooltip={t('pages.market.cards.expiration_time.desc', "The period while you can make your bets, or exit them if you changed your mind")}
              value={tradeTimerExpiry ? <Countdown
                value={moment.unix(tradeTimerExpiry)}
                format="DD [days] HH:mm:ss" /> : '-'}
              subValue={<span>{t('pages.market.status', "status").toUpperCase()}: <span style={{ color: tradeStatusColor, textTransform: 'uppercase' }}>{tradeStatus}</span></span>} />
          </Col>
        </Row>
      </div>

      {dataForChart.length > 0 && <div>
        <div className={styles.typeChartSelectorWrap}>
          <Radio.Group value={chartType} className={styles.typeChartSelector} onChange={(ev) => setChartType(ev.target.value)}>
            <Radio.Button value="prices">{t('pages.market.chart.prices', "Prices")}</Radio.Button>
            <Radio.Button value="supplies">{t('pages.market.chart.supplies', "Supplies")}</Radio.Button>
            <Radio.Button value="fee">{t('pages.market.chart.fee', "Fee accumulation")}</Radio.Button>
            <Radio.Button value="apy">{!result ? t('pages.market.chart.estimated_apy', "Estimated APY") : t('pages.market.chart.apy', "APY")}</Radio.Button>
          </Radio.Group>
        </div>
        <Line {...chartConfig} data={dataForChart} />
        {chartType === 'apy' && <div className={styles.apyChartDescWrap}>
          <div>
            {t('pages.market.chart.liquidity_date', "Liquidity provision date")}
          </div>
          <div className={styles.apyChartDesc}>
            {committed_at
              ? t('pages.market.chart.apy_desc', "APY that would be earned if an infinitesimal amount of liquidity were added on the date on the chart and held until the outcome was published.")
              : t('pages.market.chart.estimated_apy_desc', "Estimated APY that would be earned if an infinitesimal amount of liquidity were added on the date on the chart and held until the event date. The estimation assumes that trading activity stays the same as it has been so far.")}
          </div>
        </div>}
      </div>}

      <div style={{ marginTop: 50 }}>
        <Row gutter={10} align="middle" justify="space-between">
          <Col md={{ span: showMarketSizePie ? 12 : 24 }} xs={{ span: 24 }}>
            <h2 style={{ fontSize: 28 }}>{t('pages.market.apy.title', "Make money from liquidity provision")}</h2>
            <Typography.Paragraph>
              {reserve !== 0 && <span>{t('pages.market.apy.every_trade', "Every trade is charged a fee which is added to the market’s pool (see the fee accumulation chart above).")}</span>}
              {t('pages.market.apy.earn', "Earn a share of these fees by buying all tokens in the same proportions they are already issued. One of the tokens will win, and you’ll get a share of the trading fees collected after you invested.")}
            </Typography.Paragraph>
            <Typography.Paragraph>
              {t('pages.market.apy.by_buying', "By buying all tokens without changing their proportions you are not betting on any outcome but taking a market-neutral position instead and adding liquidity to the market. This is safe if the current proportions reflect the true probabilities.")}
            </Typography.Paragraph>

            <div className={styles.apyWrap}>
              <div className={styles.apyPanel}>{t('pages.market.apy.block', "Liquidity provision APY since the pool was started: {{percent}}%", { percent: apyView })}</div>
              <div className={styles.apyDesc}>{t('pages.market.apy.block_desc', "The APY estimation is for the first LP assuming the trading activity stays the same as it has been so far. Later LPs earn from fewer trades, and the trading activity can change in the future, so the actual APY can be significantly different.")}</div>
            </div>

            <AddLiquidityModal disabled={!tradeIsActive} yes_team={teams?.yes?.name} no_team={teams?.no?.name} />
          </Col>

          {showMarketSizePie && <Col md={{ span: 8 }} xs={{ span: 24 }}>
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
        <h2 style={{ marginBottom: 15, marginTop: 50, fontSize: 28 }}>{t('pages.market.recent_events', "Recent events")}</h2>
        <RecentEvents />
      </div>

    </div>
  </Layout>
}