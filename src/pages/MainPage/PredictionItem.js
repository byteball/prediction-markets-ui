import { Fragment, useEffect, useRef, useState } from "react";
import { TinyLine } from '@ant-design/plots';
import { Badge, Card, Col, Row, Space, Tooltip } from "antd";
import { Link } from "react-router-dom";
import moment from 'moment';
import { useSelector } from 'react-redux';
import { min } from 'lodash';

import { selectReservesRate } from 'store/slices/settingsSlice';

import styles from "./PredictionItem.module.css";

const max_display_decimals = 5;

export const PredictionItem = ({ category, reserve_asset = 'base', aa_address, event, reserve = 0, reserve_decimals = 0, yes_decimals = 0, no_decimals = 0, draw_decimals = 0, yes_price = 0, no_price = 0, draw_price = 0, allow_draw, end_of_trading_period, candles, reserve_symbol, yes_symbol, result, waiting_period_length }) => {
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
  const now = moment.utc().unix();
  const currentReserveRate = reservesRates[reserve_asset] || {};

  useEffect(async () => {
    const data = (candles || []).map(({ price }) => price);

    const minValue = min(data);

    setConfig(c => ({
      ...c,
      tooltip: {
        customContent: (_, data) => {
          if (data && data[0]) {
            const { value } = data[0];
            return <span>1 {yes_symbol || "YES-token"} = {Number(+value + minValue).toFixed(max_display_decimals)} {reserve_symbol}</span>
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
  const expirationDateView = moment.unix(end_of_trading_period).format('ll')
  const afterExpirationDateView = moment.unix(end_of_trading_period).fromNow();

  const isExpiry = now > end_of_trading_period;
  const Wrapper = isExpiry ? Badge.Ribbon : Fragment;
  let status = '';
  let color = 'red'
  if (isExpiry) {
    if (result) {
      status = 'Claiming profit';
      color = '#05c46b'
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

  return <Wrapper {...wrapperProps}><Link to={`/market/${aa_address}`}>
    <Card className={styles.itemWrap} style={{ color: "#fff", opacity: isExpiry ? 0.5 : 1 }}>
      <Row gutter={10}>
        <Col md={{ span: 16 }} xs={{ span: 24 }} sm={{ span: 24 }} ref={infoWrapRef}>
          <Space className={styles.notifyWrap}>
            {category && <span className='firstBigLetter'>{category} </span>}<span>Expiration {expirationDateView} ({afterExpirationDateView})</span>
          </Space>

          <div className={styles.eventDesc}>
            {event}
          </div>

          <Row className={styles.infoWrap} gutter={10}>
            <Col md={{ span: 6 }} xs={{ span: 12 }}>
              <Tooltip title="reserve">
                <div className={styles.infoTitle}>reserve</div>
                <div>{reserveView} <small>{reserve_symbol}</small></div>
                <div className={styles.infoValueInDollar}>${+Number(reserveView * currentReserveRate).toFixed(2)}</div>
              </Tooltip>
            </Col>
            <Col md={{ span: 6 }} xs={{ span: 12 }}>
              <Tooltip title="yes price">
                <div style={{ color: '#05c46b' }}>
                  <div className={styles.infoTitle}>yes price</div>
                  <div style={{ fontSize: 13 }}>{yesPriceView} <small>{reserve_symbol}</small></div>
                  <div className={styles.infoValueInDollar}>${+Number(yes_price * currentReserveRate).toFixed(2)}</div>
                </div>
              </Tooltip>
            </Col>
            <Col md={{ span: 6 }} xs={{ span: 12 }}>
              <Tooltip title="no price">
                <div style={{ color: '#ff5e57' }}>
                  <div className={styles.infoTitle}>no price</div>
                  <div style={{ fontSize: 13 }}>{noPriceView} <small>{reserve_symbol}</small></div>
                  <div className={styles.infoValueInDollar}>${+Number(no_price * currentReserveRate).toFixed(2)}</div>
                </div>
              </Tooltip>
            </Col>
            <Col md={{ span: 6 }} xs={{ span: 12 }}>
              <Tooltip title="draw price">
                <div className={styles.infoTitle}>draw price</div>
                {allow_draw ? <div style={{ color: '#ffc048' }}>
                  <div style={{ fontSize: 13 }}>{drawPriceView} <small>{reserve_symbol}</small></div>
                  <div className={styles.infoValueInDollar}>${+Number(draw_price * currentReserveRate).toFixed(2)}</div>
                </div> : <span style={{ color: '#ffc048' }}>-</span>}
              </Tooltip>
            </Col>
          </Row>
        </Col>

        {infoHeight && dataForChart.length > 0 && <Col md={{ span: 8 }} xs={{ span: 24 }} sm={{ span: 24 }} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ height: infoHeight * 0.7, width: '100%', boxSizing: 'border-box' }}>
            <TinyLine {...config} data={dataForChart} />
          </div>
        </Col>}
      </Row>
    </Card>
  </Link>
  </Wrapper>
}