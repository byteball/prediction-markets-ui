import { Fragment, useEffect, useRef, useState } from "react";
import { TinyLine } from '@ant-design/plots';
import { Badge, Card, Col, Row, Space, Typography } from "antd";
import { Link } from "react-router-dom";
import moment from 'moment';
import { useSelector } from 'react-redux';
import { min } from 'lodash';
import { Img } from 'react-image';

import { selectPriceOrCoef, selectReservesRate } from 'store/slices/settingsSlice';

import { CreateNowModal } from "modals";
import { generateTextEvent } from "utils";

import appConfig from "appConfig";

import styles from "./PredictionItem.module.css";
import { useWindowSize } from "hooks/useWindowSize";

const max_display_decimals = 5;

export const PredictionItem = ({ reserve_asset = 'base', aa_address, reserve = 0, reserve_decimals = 0, yes_decimals = 0, no_decimals = 0, draw_decimals = 0, yes_price = 0, no_price = 0, draw_price = 0, allow_draw, end_of_trading_period, candles, reserve_symbol, yes_symbol, result, waiting_period_length, feed_name, expect_datafeed_value, datafeed_value, oracle, comparison, yes_team_id, no_team_id, yes_team, no_team, supply_yes = 0, supply_no = 0, supply_draw = 0, league_emblem, league, actualChampionship, type, preview }) => {
  const infoWrapRef = useRef();
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
  const priceOrCoef = useSelector(selectPriceOrCoef);
  const now = moment.utc().unix();
  const currentReserveRate = reservesRates[reserve_asset] || {};

  const [width] = useWindowSize();

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

  const reserveView = +Number(reserve / 10 ** reserve_decimals).toPrecision(max_display_decimals);
  const yesPriceView = +Number(yes_price / 10 ** yes_decimals).toPrecision(max_display_decimals);
  const noPriceView = +Number(no_price / 10 ** no_decimals).toPrecision(max_display_decimals);
  const drawPriceView = +Number(draw_price / 10 ** draw_decimals).toPrecision(max_display_decimals);
  const expirationDateView = moment.unix(end_of_trading_period).format('lll')
  const afterExpirationDateView = moment.unix(end_of_trading_period).fromNow();

  const event = generateTextEvent({
    end_of_trading_period,
    feed_name,
    datafeed_value,
    oracle,
    comparison
  });

  const isExpiry = now > end_of_trading_period;
  const Wrapper = isExpiry ? Badge.Ribbon : Fragment;

  let status = '';
  let color = 'red'

  if (isExpiry) {
    if (result) {
      status = 'Claiming profit';
      color = appConfig.YES_COLOR
    } else {
      if (now > (end_of_trading_period + waiting_period_length)) {
        status = 'Resume trading';
      } else {
        status = 'Waiting for results';
        color = '#f39c12'
      }
    }
  }

  const wrapperProps = isExpiry ? {
    color,
    text: <div style={{ fontSize: 12 }}>{status}</div>,
    placement: "start"
  } : {};

  const exists = !!aa_address || preview;

  const isSportMarket = !!appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === oracle);
  const marketHasCrests = isSportMarket ? yes_team_id !== undefined && no_team_id !== undefined : false;

  const SecondWrapper = exists && !preview ? Link : Fragment
  const secondWrapperProps = exists ? { to: `/market/${aa_address}` } : {};

  let yes_coef = 0;
  let draw_coef = 0;
  let no_coef = 0;

  if (reserve !== 0) {
    yes_coef = supply_yes !== 0 ? +Number((reserve / supply_yes) / yes_price).toFixed(5) : null;
    no_coef = supply_no !== 0 ? +Number((reserve / supply_no) / no_price).toFixed(5) : null;
    draw_coef = supply_draw !== 0 ? +Number((reserve / supply_draw) / draw_price).toFixed(5) : null;
  }

  return <Wrapper {...wrapperProps}>
    <SecondWrapper {...secondWrapperProps}>
      <Card className={styles.itemWrap} style={{ color: "#fff", opacity: isExpiry ? 0.5 : 1 }}>
        <Row gutter={10} align="middle">
          <Col md={{ span: 16 }} xs={{ span: 24 }} sm={{ span: 24 }} ref={infoWrapRef}>
            {/* {!isSportMarket && <Space className={styles.notifyWrap}>
              <span>Expiration {expirationDateView} ({afterExpirationDateView})</span>
            </Space>} */}
            {!marketHasCrests ? <div className={styles.eventDesc}>
              {event}
            </div> : <div style={{ marginTop: 5 }}>
              <Row gutter={8} align={(exists && allow_draw && draw_coef) ? "bottom" : 'middle'}>
                <Col sm={{ span: 8 }} xs={{ span: 24 }} style={{ textAlign: 'center' }}>
                  <Img unloader={<div/>} src={[`https://crests.football-data.org/${yes_team_id}.png`, `https://crests.football-data.org/${yes_team_id}.svg`]} className={styles.crests} />
                  <div className={styles.teamWrap}>
                    <Typography.Text style={{ color: appConfig.YES_COLOR, textOverflow: 'ellipsis', display: 'block' }} ellipsis={true}><small>{yes_team}</small></Typography.Text>
                  </div>

                  {exists && yes_coef && no_coef ? <div style={{ color: appConfig.YES_COLOR }}> {priceOrCoef === 'price' ? `${yesPriceView} ${reserve_symbol}` : `x${yes_coef}`}</div> : null}
                </Col>

                <Col sm={{ span: 8 }} xs={{ span: 24 }} style={{ textAlign: 'center' }} className={styles.draw}>
                  <b style={{ fontSize: 24 }}>VS</b>
                  <div>
                    <small>{moment.unix(end_of_trading_period).format('lll')}</small>
                  </div>
                  {exists && allow_draw && draw_coef ? <div style={{ color: appConfig.DRAW_COLOR }}>
                    <div style={{ lineHeight: 1 }}><small>draw</small></div>
                    <div>{priceOrCoef === 'price' ? `${drawPriceView} ${reserve_symbol}` : `x${draw_coef}`}</div>
                  </div> : null}
                </Col>

                <Col sm={{ span: 8 }} xs={{ span: 24 }} style={{ textAlign: 'center' }}>
                  <Img
                    src={[`https://crests.football-data.org/${no_team_id}.png`, `https://crests.football-data.org/${no_team_id}.svg`]}
                    className={styles.crests}
                    unloader={<div/>}
                  />
                  <div className={styles.teamWrap}>
                    <Typography.Text style={{ color: appConfig.NO_COLOR, textOverflow: 'ellipsis', display: 'block' }} ellipsis={true}><small>{no_team}</small></Typography.Text>
                  </div>

                  {exists && no_coef && yes_coef ? <div style={{ color: appConfig.NO_COLOR }}>
                    {priceOrCoef === 'price' ? `${noPriceView} ${reserve_symbol}` : `x${no_coef}`}
                  </div> : null}
                </Col>
              </Row>
            </div>}

            {exists && !isSportMarket && <Row className={styles.infoWrap} gutter={10}>
              <Col md={{ span: 6 }} xs={{ span: 12 }}>
                <div>
                  <div className={styles.infoTitle}>reserve</div>
                  <div>{reserveView} <small>{reserve_symbol}</small></div>
                  {priceOrCoef === 'price' && <div className={styles.infoValueInDollar}>${+Number(reserveView * currentReserveRate).toFixed(2)}</div>}
                </div>
              </Col>
              <Col md={{ span: 6 }} xs={{ span: 12 }}>
                <div style={{ color: appConfig.YES_COLOR }}>
                  <div className={styles.infoTitle}>yes price</div>
                  <div style={{ fontSize: 13 }}>{<div>{priceOrCoef === 'price' ? `${yesPriceView} ${reserve_symbol}` : yes_coef ? `x${yes_coef}` : '-'}</div>}</div>
                  {priceOrCoef === 'price' && <div className={styles.infoValueInDollar}>${+Number(yes_price * currentReserveRate).toFixed(2)}</div>}
                </div>
              </Col>
              <Col md={{ span: 6 }} xs={{ span: 12 }}>
                <div style={{ color: appConfig.NO_COLOR }}>
                  <div className={styles.infoTitle}>no price</div>
                  <div style={{ fontSize: 13 }}>{<div>{priceOrCoef === 'price' ? `${noPriceView} ${reserve_symbol}` : (no_coef ? `x${no_coef}` : '-')}</div>}</div>
                  {priceOrCoef === 'price' && <div className={styles.infoValueInDollar}> ${+Number(no_price * currentReserveRate).toFixed(2)}</div>}
                </div>
              </Col>
              <Col md={{ span: 6 }} xs={{ span: 12 }}>
                {allow_draw ? <div>
                  <div className={styles.infoTitle}>draw price</div>
                  <div style={{ color: appConfig.DRAW_COLOR }}>
                    <div style={{ fontSize: 13 }}>{<div>{priceOrCoef === 'price' ? `${drawPriceView} ${reserve_symbol}` : draw_coef ? `x${draw_coef}` : '-'}</div>}</div>
                    {priceOrCoef === 'price' && <div className={styles.infoValueInDollar}> ${+Number(draw_price * currentReserveRate).toFixed(2)}</div>}
                  </div>
                </div> : null}
              </Col>
            </Row>}
          </Col>
          {/* && width >= 992 */}
          {(exists || preview) ? (infoHeight && dataForChart.length > 0 && <Col md={{ span: 8 }} xs={{ span: 24 }} sm={{ span: 24 }} style={{ display: 'flex', alignItems: 'center' }}>
            {width >= 768 && <div style={{ height: infoHeight * 0.7, width: '100%', boxSizing: 'border-box' }}>
              <TinyLine {...config} data={dataForChart} />
            </div>}
          </Col>) : <Col md={{ span: 8 }} xs={{ span: 24 }} sm={{ span: 24 }}>
            <div className={styles.createNowWrap}>
              <CreateNowModal
                feed_name={feed_name}
                end_of_trading_period={end_of_trading_period}
                event={event}
                expect_datafeed_value={expect_datafeed_value}
                no_team_id={no_team_id}
                no_team={no_team}
                yes_team_id={yes_team_id}
                yes_team={yes_team}
              />
            </div>
          </Col>}
        </Row>
      </Card>
    </SecondWrapper>
  </Wrapper>
}