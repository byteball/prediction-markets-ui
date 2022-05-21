import { Fragment, useEffect, useRef, useState } from "react";
import { TinyLine } from '@ant-design/plots';
import { Badge, Card, Col, Row, Space, Tooltip } from "antd";
import { Link } from "react-router-dom";
import moment from 'moment';
import { useSelector } from 'react-redux';
import { isEmpty, min } from 'lodash';

import { selectReservesHourlyRate } from 'store/slices/settingsSlice';

import styles from "./PredictionItem.module.css";

const max_display_decimals = 5;

export const PredictionItem = ({ category, reserve_asset = 'base', aa_address, event, reserve = 0, reserve_decimals = 0, yes_decimals = 0, no_decimals = 0, draw_decimals = 0, yes_price = 0, no_price = 0, draw_price = 0, allow_draw, end_of_trading_period, candles, reserve_symbol, yes_symbol }) => {
  const infoWrapRef = useRef();
  const [infoHeight, setInfoHeight] = useState();
  const [dataForChart, setDataForChart] = useState([]);
  const [config, setConfig] = useState({
    autoFit: true,
    smooth: true,
    renderer: 'svg',
    animation: false,
    meta: {
      nice: true
    },
    color: "#2D72F6"
  });

  const hourlyRates = useSelector(selectReservesHourlyRate);

  const nowHourTimestamp = moment.utc().startOf("hour").unix();
  const now = moment.utc().unix();
  const hourlyRateByReserveAsset = hourlyRates[reserve_asset] || {};
  const currentReserveRate = !isEmpty(hourlyRateByReserveAsset) ? hourlyRateByReserveAsset[nowHourTimestamp] || hourlyRateByReserveAsset[nowHourTimestamp - 3600] || 0 : 0;

  useEffect(async () => {
    let data = [];

    if (!isEmpty(hourlyRateByReserveAsset)) {
      (candles || []).forEach((item, i) => {
        data = [...data, item.price * hourlyRateByReserveAsset[item.timestamp]]
      });
    }
    const minValue = min(data);
    setConfig(c => ({
      ...c,
      tooltip: {
        customContent: (_, data) => {
          if (data && data[0]) {
            const { value } = data[0];
            return <span>1 {yes_symbol || "YES-token"} = ${Number(+value + minValue).toFixed(2)}</span>
          }
        }
      }
    }));

    setDataForChart(data.map((value) => value - minValue));
  }, [candles, hourlyRates, yes_symbol]);

  useEffect(() => {
    const height = infoWrapRef.current.clientHeight;

    if (height) {
      setInfoHeight(height);
    }
  }, [infoWrapRef.current]);

  const reserveView = +Number(reserve / 10 ** reserve_decimals).toPrecision(max_display_decimals);
  const yesPriceView = +Number(yes_price / 10 ** yes_decimals).toPrecision(max_display_decimals + 2);
  const noPriceView = +Number(no_price / 10 ** no_decimals).toPrecision(max_display_decimals + 2);
  const drawPriceView = +Number(draw_price / 10 ** draw_decimals).toPrecision(max_display_decimals + 2);
  const expirationDateView = moment.unix(end_of_trading_period).format('ll')
  const afterExpirationDateView = moment.unix(end_of_trading_period).fromNow();

  const isExpiry = now > end_of_trading_period;
  const Wrapper = false && isExpiry ? Badge.Ribbon : Fragment;

  const wrapperProps = false && isExpiry ? {
    color: "red",
    text: <div style={{ fontSize: 12 }}>Expiry</div>,
    placement: "start"
  } : {};

  return <Wrapper {...wrapperProps}><Link to={`/market/${aa_address}`}>
    <Card className={styles.itemWrap} style={{ color: "#fff" }}>
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
                <div>${+Number(reserveView * currentReserveRate).toFixed(2)}</div>
                <div className={styles.infoValueInCrypto}>{reserveView} {reserve_symbol}</div>
              </Tooltip>
            </Col>
            <Col md={{ span: 6 }} xs={{ span: 12 }}>
              <Tooltip title="yes price">
                <div className={styles.infoTitle}>yes price</div>
                <div>${+Number(yesPriceView * currentReserveRate).toFixed(2)}</div>
                <div className={styles.infoValueInCrypto}>{yesPriceView} {reserve_symbol}</div>
              </Tooltip>
            </Col>
            <Col md={{ span: 6 }} xs={{ span: 12 }}>
              <Tooltip title="no price">
                <div className={styles.infoTitle}>no price</div>
                <div>${+Number(no_price * currentReserveRate).toFixed(2)}</div>
                <div className={styles.infoValueInCrypto}>{noPriceView} {reserve_symbol}</div>
              </Tooltip>
            </Col>
            <Col md={{ span: 6 }} xs={{ span: 12 }}>
              <Tooltip title="draw price">
                <div className={styles.infoTitle}>draw price</div>
                {allow_draw ? <>
                  <div>${+Number(draw_price * currentReserveRate).toFixed(2)}</div>
                  <div className={styles.infoValueInCrypto}>{drawPriceView} {reserve_symbol}</div>
                </> : "-"}
              </Tooltip>
            </Col>
          </Row>
        </Col>

        {infoHeight && dataForChart.length > 0 && <Col md={{ span: 8 }} xs={{ span: 24 }} sm={{ span: 24 }} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ height: infoHeight * 0.7, width: '100%', boxSizing: 'border-box' }}>
            <TinyLine {...config} data={dataForChart} />
            {/* {dataForChart.length > 0 && <div style={{ textAlign: 'center', color: '#ddd' }}>
              <small>last 24 hours</small>
            </div>} */}
          </div>
          {/* <div ref={chartRef} /> */}
        </Col>}
      </Row>
    </Card>
  </Link>
  </Wrapper>
}