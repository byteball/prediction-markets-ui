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
  const Wrapper = isExpiry ? Badge.Ribbon : Fragment;
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

  const wrapperProps = isExpiry ? {
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
    yesOddsView = supply_yes !== 0 ? +Number((reserve / supply_yes) / yes_price).toFixed(5) : null;
    noOddsView = supply_no !== 0 ? +Number((reserve / supply_no) / no_price).toFixed(5) : null;
    drawOddsView = supply_draw !== 0 ? +Number((reserve / supply_draw) / draw_price).toFixed(5) : null;
  }

  return <Wrapper {...wrapperProps}>
    <SecondWrapper {...secondWrapperProps}>
      <Card className={styles.itemWrap} style={{ opacity: isExpiry ? 0.5 : 1 }}>
        <Row gutter={10} align="middle">
          <Col md={{ span: 16 }} xs={{ span: 24 }} sm={{ span: 24 }} ref={infoWrapRef}>
            {!marketHasCrests ? <div className={styles.eventDesc}>
              {eventView}
            </div> : <div style={{ marginTop: 5 }}>
              <Row gutter={8} align={(exists && allow_draw && drawOddsView && width >= 576) ? "bottom" : 'middle'}>
                <Col sm={{ span: 8 }} xs={{ span: 8 }} style={{ textAlign: 'center' }}>
                  <Img unloader={<div />} src={[`https://crests.football-data.org/${yes_team_id}.png`, `https://crests.football-data.org/${yes_team_id}.svg`]} className={styles.crests} />
                  <div className={styles.teamWrap}>
                    <Typography.Text style={{ color: appConfig.YES_COLOR }} className={styles.team} ellipsis={true}><small>{yes_team}</small></Typography.Text>
                  </div>

                  {exists && yesOddsView && noOddsView ? <div style={{ color: appConfig.YES_COLOR }}><span className={styles.price}>{priceOrOdds === 'price' ? <>{yesPriceView} <small>{reserve_symbol}</small></> : `x${yesOddsView}`}</span></div> : null}
                </Col>

                <Col sm={{ span: 8 }} xs={{ span: 8 }} style={{ textAlign: 'center' }} className={styles.draw}>
                  <b style={{ fontSize: 24 }}>VS</b>
                  <div className={styles.time}>
                    <small>{moment.unix(event_date).format('lll')}</small>
                  </div>
                  {(exists && allow_draw && drawOddsView && width >= 576) ? <div style={{ color: appConfig.DRAW_COLOR }}>
                    <div className={styles.team}><small>draw</small></div>
                    <span className={styles.price}>{priceOrOdds === 'price' ? <>{drawPriceView} <small>{reserve_symbol}</small></> : `x${drawOddsView}`}</span>
                  </div> : null}
                </Col>

                <Col sm={{ span: 8 }} xs={{ span: 8 }} style={{ textAlign: 'center' }}>
                  <Img
                    src={[`https://crests.football-data.org/${no_team_id}.png`, `https://crests.football-data.org/${no_team_id}.svg`]}
                    className={styles.crests}
                    unloader={<div />}
                  />
                  <div className={styles.teamWrap}>
                    <Typography.Text style={{ color: appConfig.NO_COLOR }} className={styles.team} ellipsis={true}>
                      <small>{no_team}</small>
                    </Typography.Text>
                  </div>

                  {exists && noOddsView && yesOddsView ? <div style={{ color: appConfig.NO_COLOR }}>
                    <span className={styles.price}>{priceOrOdds === 'price' ? <>{noPriceView} <small>{reserve_symbol}</small></> : `x${noOddsView}`}</span>
                  </div> : null}
                </Col>
              </Row>
            </div>}

            {exists && !isSportMarket && <Row className={styles.infoWrap} gutter={10}>
              <Col md={{ span: 6 }} xs={{ span: 12 }}>
                <div>
                  <div className={styles.infoTitle}>reserve</div>
                  <div>{reserveView} <small>{reserve_symbol}</small></div>
                  {(priceOrOdds === 'price' && currentReserveRate) ? <div className={styles.infoValueInDollar}>${+Number(reserveView * currentReserveRate).toFixed(2)}</div> : null}
                </div>
              </Col>
              <Col md={{ span: 6 }} xs={{ span: 12 }}>
                <div style={{ color: appConfig.YES_COLOR }}>
                  <div className={styles.infoTitle}>yes {priceOrOdds}</div>
                  <div style={{ fontSize: 13 }}>{<div>{priceOrOdds === 'price' ? `${yesPriceView} ${reserve_symbol}` : yesOddsView ? `x${yesOddsView}` : '-'}</div>}</div>
                  {(priceOrOdds === 'price' && currentReserveRate) ? <div className={styles.infoValueInDollar}>${+Number(yes_price * currentReserveRate).toFixed(2)}</div> : null}
                </div>
              </Col>
              <Col md={{ span: 6 }} xs={{ span: 12 }}>
                <div style={{ color: appConfig.NO_COLOR }}>
                  <div className={styles.infoTitle}>no {priceOrOdds}</div>
                  <div style={{ fontSize: 13 }}>{<div>{priceOrOdds === 'price' ? `${noPriceView} ${reserve_symbol}` : (noOddsView ? `x${noOddsView}` : '-')}</div>}</div>
                  {(priceOrOdds === 'price' && currentReserveRate) ? <div className={styles.infoValueInDollar}> ${+Number(no_price * currentReserveRate).toFixed(2)}</div> : null}
                </div>
              </Col>
              <Col md={{ span: 6 }} xs={{ span: 12 }}>
                {allow_draw ? <div>
                  <div className={styles.infoTitle}>draw {priceOrOdds}</div>
                  <div style={{ color: appConfig.DRAW_COLOR }}>
                    <div style={{ fontSize: 13 }}>{<div>{priceOrOdds === 'price' ? `${drawPriceView} ${reserve_symbol}` : drawOddsView ? `x${drawOddsView}` : '-'}</div>}</div>
                    {(priceOrOdds === 'price' && currentReserveRate) ? <div className={styles.infoValueInDollar}> ${+Number(draw_price * currentReserveRate).toFixed(2)}</div> : null}
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