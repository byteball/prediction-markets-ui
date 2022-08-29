import { Fragment, useEffect, useRef, useState } from "react";
import { TinyLine } from '@ant-design/plots';
import { Badge, Card, Col, Row, Typography } from "antd";
import { Link } from "react-router-dom";
import moment from 'moment';
import { useSelector } from 'react-redux';
import { min } from 'lodash';
import { Img } from 'react-image';

import { selectPriceOrOdds, selectReservesRate } from 'store/slices/settingsSlice';

import { CreateNowModal } from "modals";
import { generateTextEvent } from "utils";
import { useWindowSize } from "hooks";

import appConfig from "appConfig";

import styles from "./PredictionItem.module.css";

const max_display_decimals = 5;

export const PredictionItem = ({ reserve_asset = 'base', aa_address, reserve = 0, reserve_decimals = 0, yes_price = 0, no_price = 0, draw_price = 0, allow_draw, event_date, candles, reserve_symbol, yes_symbol, result, waiting_period_length, feed_name, expect_datafeed_value, datafeed_value, oracle, comparison, yes_team_id, no_team_id, yes_team, no_team, supply_yes = 0, supply_no = 0, supply_draw = 0, preview, apy = 0, quiet_period = 0 }) => {
  const infoWrapRef = useRef();
  const [width] = useWindowSize();

  const [infoHeight, setInfoHeight] = useState();
  const [dataForChart, setDataForChart] = useState([]);
  const [config, setConfig] = useState({
    autoFit: true,
    smooth: true,
    renderer: 'svg',
    animation: false,
    theme: {
      background: 'transparent'
    },
    meta: {
      nice: true
    },
    color: "#2D72F6"
  });

  const reservesRates = useSelector(selectReservesRate);
  const priceOrOdds = useSelector(selectPriceOrOdds);

  const now = moment.utc().unix();
  const isExpiry = now > event_date;
  const exists = !!aa_address || preview;
  const currentReserveRate = reservesRates[reserve_asset] || 0;

  useEffect(async () => {
    const data = preview ? candles : (candles ? (candles.length === 1 ? [...candles, ...candles] : candles) : []).map(({ price }) => price);

    const minValue = min(data);

    setConfig(c => ({
      ...c,
      tooltip: {
        customContent: (_, data) => {
          if (data && data[0]) {
            const { value } = data[0];
            return <span>{yes_team || yes_symbol || "YES-token"} price - {+Number(+value + minValue).toFixed(max_display_decimals)} {reserve_symbol}</span>
          }
        }
      }
    }));

    setDataForChart(data.map((value) => value - minValue));
  }, [candles, yes_symbol]);

  useEffect(() => {
    const height = infoWrapRef.current.clientHeight;

    if (height) {
      setInfoHeight(height);
    }
  }, [infoWrapRef.current]);

  // views
  const reserveView = +Number(reserve / 10 ** reserve_decimals).toPrecision(max_display_decimals);
  const yesPriceView = +Number(yes_price).toPrecision(max_display_decimals);
  const noPriceView = +Number(no_price).toPrecision(max_display_decimals);
  const drawPriceView = +Number(draw_price).toPrecision(max_display_decimals);
  const apyView = apy ? (apy < 500 ? `Liquidity provider APY: ${Number(apy).toFixed(2)}%` : 'APY not shown') : 'APY not available yet';
  const eventView = generateTextEvent({
    event_date,
    feed_name,
    datafeed_value: expect_datafeed_value || datafeed_value,
    oracle,
    comparison
  });

  // wrappers configure
  const Wrapper = isExpiry && aa_address ? Badge.Ribbon : Fragment;
  let status = '';
  let color = 'red'

  if (isExpiry) {
    if (result) {
      status = 'Claiming profit';
      color = appConfig.YES_COLOR
    } else {
      if (now > (event_date + waiting_period_length)) {
        status = 'Resumed trading';
      } else {
        status = 'Waiting for results';
        color = '#e58e26'
      }
    }
  }

  const wrapperProps = isExpiry && aa_address ? {
    color,
    text: <div style={{ fontSize: 12 }}>{status}</div>,
    placement: "start"
  } : {};

  const isSportMarket = !!appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === oracle);
  const marketHasCrests = isSportMarket ? yes_team_id !== undefined && no_team_id !== undefined : false;
  const SecondWrapper = exists && !preview ? Link : Fragment
  const secondWrapperProps = exists ? { to: `/market/${aa_address}` } : {};

  // calc odds
  let yesOddsView = 0;
  let drawOddsView = 0;
  let noOddsView = 0;

  if (reserve !== 0) {
    yesOddsView = supply_yes !== 0 ? +Number((reserve / supply_yes) / yes_price).toFixed(5) : 0;
    noOddsView = supply_no !== 0 ? +Number((reserve / supply_no) / no_price).toFixed(5) : 0;
    drawOddsView = supply_draw !== 0 ? +Number((reserve / supply_draw) / draw_price).toFixed(5) : 0;
  }

  let winnerPriceView = 0;
  let winnerOddsView = 0;

  if (result && reserve) {
    const winnerSupply = result === 'yes' ? supply_yes : (result === 'no' ? supply_no : supply_draw);

    if (winnerSupply) {
      winnerPriceView = +Number(reserve / winnerSupply).toFixed(5);
      winnerOddsView = +Number(reserve / winnerSupply).toFixed(5);
    }
  }

  let yesValue = null;
  let noValue = null;
  let drawValue = null;

  let yesSubValue = null;
  let noSubValue = null;
  let drawSubValue = null;

  if (reserve === 0 && !result) {
    if (!isSportMarket) {
      yesValue = priceOrOdds === 'price' ? `0 ${reserve_symbol}` : `x1`;
      noValue = priceOrOdds === 'price' ? `0 ${reserve_symbol}` : `x1`;

      if (allow_draw) {
        drawValue = priceOrOdds === 'price' ? `0 ${reserve_symbol}` : `x1`;
      }
    }
  } else if (!result) {
    yesValue = priceOrOdds === 'price' ? `${yesPriceView || 0} ${reserve_symbol}` : `x${yesOddsView || 1}`;
    noValue = priceOrOdds === 'price' ? `${noPriceView || 0} ${reserve_symbol}` : `x${noOddsView || 1}`;

    if (allow_draw) {
      drawValue = priceOrOdds === 'price' ? `${drawPriceView || 0} ${reserve_symbol}` : `x${drawOddsView || 1}`;
    }

    if (priceOrOdds === 'price' && currentReserveRate) {
      if (yes_price) {
        yesSubValue = `$${+Number(yes_price * currentReserveRate).toFixed(2)}`;
      }

      if (no_price) {
        noSubValue = `$${+Number(no_price * currentReserveRate).toFixed(2)}`;
      }

      if (allow_draw && draw_price) {
        drawSubValue = `$${+Number(draw_price * currentReserveRate).toFixed(2)}`;
      }
    }

  } else if (result) {
    yesValue = 'LOSER';
    noValue = 'LOSER';

    if (allow_draw) {
      drawValue = 'LOSER';
    }

    if (result === 'yes') {
      yesValue = supply_yes ? (priceOrOdds === 'price' ? `${winnerPriceView} ${reserve_symbol}` : `x${winnerOddsView}`) : 'WINNER';
    } else if (result === 'no') {
      noValue = supply_no ? (priceOrOdds === 'price' ? `${winnerPriceView} ${reserve_symbol}` : `x${winnerOddsView}`) : 'WINNER';
    } else if (result === 'draw' && allow_draw) {
      drawValue = supply_draw ? (priceOrOdds === 'price' ? `${winnerPriceView} ${reserve_symbol}` : `x${winnerOddsView}`) : 'WINNER';
    }
  }

  return <Wrapper {...wrapperProps}>
    <SecondWrapper {...secondWrapperProps}>
      <Card className={styles.itemWrap} style={{ opacity: isExpiry ? 0.5 : 1 }}>
        <Row gutter={10} align="middle">
          <Col md={{ span: 16 }} xs={{ span: 24 }} sm={{ span: 24 }} ref={infoWrapRef}>
            {!marketHasCrests ? <div className={styles.eventDesc}>
              {eventView}
            </div> : <div style={{ marginTop: 5 }}>
              <Row gutter={8} align={(exists && allow_draw && (drawOddsView || result) && width >= 576) ? "bottom" : 'middle'}>
                <Col sm={{ span: 8 }} xs={{ span: 8 }} style={{ textAlign: 'center' }}>
                  <Img unloader={<div />} src={[`https://crests.football-data.org/${yes_team_id}.svg`, `https://crests.football-data.org/${yes_team_id}.png`]}
                    className={styles.crests}
                    container={(children) => <div style={{ position: 'relative' }}>
                      {children}
                      {result === 'yes' && <div style={{ position: 'absolute', right: 'calc(50% - 40px)', bottom: -10 }}>
                        <WinnerIcon />
                      </div>}
                    </div>
                    } />
                  <div className={styles.teamWrap}>
                    <Typography.Text style={{ color: appConfig.YES_COLOR }} className={styles.team} ellipsis={true}><small>{yes_team}</small></Typography.Text>
                  </div>

                  {exists && yesValue ? <div style={{ color: appConfig.YES_COLOR }}><span className={styles.price}>{yesValue}</span></div> : null}
                </Col>

                <Col sm={{ span: 8 }} xs={{ span: 8 }} style={{ textAlign: 'center' }} className={styles.draw}>
                  <b style={{ fontSize: 24 }}>VS</b>
                  <div className={styles.time}>
                    <small>{moment.unix(event_date).format('MMM D, h:mm A')}</small>
                  </div>
                  {(exists && allow_draw && (drawOddsView || result) && width >= 576) ? <div style={{ color: appConfig.DRAW_COLOR }}>
                    <div className={styles.team}><small>draw</small></div>
                    <div style={{ color: appConfig.DRAW_COLOR }}><span className={styles.price}>{drawValue}</span></div>
                  </div> : null}
                </Col>

                <Col sm={{ span: 8 }} xs={{ span: 8 }} style={{ textAlign: 'center' }}>
                  <Img
                    src={[`https://crests.football-data.org/${no_team_id}.svg`, `https://crests.football-data.org/${no_team_id}.png`]}
                    className={styles.crests}
                    unloader={<div />}
                    container={(children) => <div style={{ position: 'relative' }}>
                      {children}
                      {result === 'no' && <div style={{ position: 'absolute', right: 'calc(50% - 40px)', bottom: -10 }}>
                        <WinnerIcon />
                      </div>}
                    </div>
                    }
                  />

                  <div className={styles.teamWrap}>
                    <Typography.Text style={{ color: appConfig.NO_COLOR }} className={styles.team} ellipsis={true}>
                      <small>{no_team}</small>
                    </Typography.Text>
                  </div>

                  {exists && noValue ? <div style={{ color: appConfig.NO_COLOR }}><span className={styles.price}>{noValue}</span></div> : null}
                </Col>
              </Row>
            </div>}

            {exists && !isSportMarket && <Row className={styles.infoWrap} gutter={10}>
              <Col md={{ span: 6 }} xs={{ span: 12 }}>
                <div>
                  <div className={styles.infoTitle}>reserve</div>
                  <div>{reserveView} <small>{reserve_symbol}</small></div>
                  {(priceOrOdds === 'price' && currentReserveRate && !result) ? <div className={styles.infoValueInDollar}>${+Number(reserveView * currentReserveRate).toFixed(2)}</div> : null}
                </div>
              </Col>
              <Col md={{ span: 6 }} xs={{ span: 12 }}>
                <div style={{ color: appConfig.YES_COLOR }}>
                  <div className={styles.infoTitle}>yes {priceOrOdds}</div>
                  <div style={{ fontSize: 13 }}>{yesValue}</div>
                  {yesSubValue ? <div className={styles.infoValueInDollar}>{yesSubValue}</div> : null}
                </div>
              </Col>
              <Col md={{ span: 6 }} xs={{ span: 12 }}>
                <div style={{ color: appConfig.NO_COLOR }}>
                  <div className={styles.infoTitle}>no {priceOrOdds}</div>
                  <div style={{ fontSize: 13 }}>{noValue}</div>
                  {noSubValue ? <div className={styles.infoValueInDollar}>{noSubValue}</div> : null}
                </div>
              </Col>
              <Col md={{ span: 6 }} xs={{ span: 12 }}>
                {allow_draw ? <div>
                  <div className={styles.infoTitle}>draw {priceOrOdds}</div>
                  <div style={{ color: appConfig.DRAW_COLOR }}>
                    <div style={{ fontSize: 13 }}>{drawValue}</div>
                    {drawSubValue ? <div className={styles.infoValueInDollar}>{drawSubValue}</div> : null}
                  </div>
                </div> : null}
              </Col>
            </Row>}
          </Col>
          {width >= 768 && aa_address && <div className={styles.apyWrap}>
            {apyView}
          </div>}
          {(exists || preview) ? (infoHeight && dataForChart.length > 0 && <Col md={{ span: 8 }} xs={{ span: 24 }} sm={{ span: 24 }} style={{ display: 'flex', alignItems: 'center' }}>
            {width >= 768 && <div style={{ height: infoHeight * 0.7, width: '100%', boxSizing: 'border-box' }}>
              <TinyLine {...config} data={dataForChart} />
            </div>}
          </Col>) : <Col md={{ span: 8 }} xs={{ span: 24 }} sm={{ span: 24 }}>
            <div className={styles.createNowWrap}>
              <CreateNowModal
                feed_name={feed_name}
                oracle={oracle}
                event_date={event_date}
                event={eventView}
                expect_datafeed_value={expect_datafeed_value}
                waiting_period_length={waiting_period_length}
                no_team_id={no_team_id}
                no_team={no_team}
                yes_team_id={yes_team_id}
                yes_team={yes_team}
                quiet_period={quiet_period}
                comparison={comparison}
              />
            </div>
          </Col>}
        </Row>
      </Card>
    </SecondWrapper>
  </Wrapper>
}

const WinnerIcon = () => <img src="/winner-icon-stroke.svg" style={{ width: 32 }} alt="" />