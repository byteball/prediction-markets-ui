import { Line } from '@ant-design/plots';
import { useEffect, useRef, useState } from "react";
import { Col, Row, Space, Tooltip } from "antd";
import { Link } from "react-router-dom";
import moment from 'moment';

import styles from "./PredictionItemTWO.module.css";
import { useSelector } from 'react-redux';
import { selectReservesToUsdRate } from 'store/slices/settingsSlice';

export const data = [
  {
    "date": "1850",
    "value": 0,
    "type": "YES"
  },

  {
    "date": "1850",
    "value": 0,
    "type": "NO"
  },
  {
    "date": "1850",
    "value": 0,
    "type": "DRAW"
  },


  {
    "date": "1851",
    "value": 10,
    "type": "YES"
  },

  {
    "date": "1851",
    "value": 20,
    "type": "NO"
  },
  {
    "date": "1851",
    "value": 15,
    "type": "DRAW"
  },



  {
    "date": "1852",
    "value": 19,
    "type": "YES"
  },

  {
    "date": "1852",
    "value": 18,
    "type": "NO"
  },
  {
    "date": "1852",
    "value": 16,
    "type": "DRAW"
  },




  {
    "date": "1853",
    "value": 29,
    "type": "YES"
  },

  {
    "date": "1853",
    "value": 28,
    "type": "NO"
  },
  {
    "date": "1853",
    "value": 26,
    "type": "DRAW"
  },

  {
    "date": "1854",
    "value": 39,
    "type": "YES"
  },

  {
    "date": "1854",
    "value": 48,
    "type": "NO"
  },
  {
    "date": "1854",
    "value": 96,
    "type": "DRAW"
  },
];



const config = {
  xField: 'date',
  yField: 'value',
  seriesField: 'type',
  legend: false,
  xAxis: false,
  yAxis: false,
  autoFit: true,
  animation: false,
  annotations: false,
  label: null,
  labelOffset: 0,
  renderer: 'svg',
  antialias: true,
  appendPadding: 0,
  padding: [0, 0, 0, 0],
  meta: {
    count: { min: 0 }
  },
  color: ({ type }) => {
    return type === 'NO' ? '#ffa39e' : type === 'YES' ? '#b7eb8f' : '#ffe58f';
  }
};

const max_display_decimals = 5;

export const PredictionItem = ({category, aa_address, event, reserve_asset, reserve = 0, reserve_decimals = 0, yes_decimals = 0, no_decimals = 0, draw_decimals = 0, yes_price = 0, no_price = 0, draw_price = 0, allow_draw, end_of_trading_period, candles, reserve_symbol, yes_symbol, no_symbol, draw_symbol }) => {
  const infoWrapRef = useRef();
  const [infoHeight, setInfoHeight] = useState();
  const rates = useSelector(selectReservesToUsdRate);
  const currentReserveRate = rates ? rates[reserve_asset] : 0;
  const [dataForChart, setDataForChart] = useState([]);

  // {
  //   "date": "1850",
  //   "value": 0,
  //   "type": "YES"
  // },

  useEffect(async () => {
    let data = [];
    (candles || []).forEach((item, i) => {
      data = [...data,
      {
        "date": item.start_timestamp,
        "value": item.yes_price * item.reserve_to_usd_rate,
        "type": "YES"
      },
      {
        "date": item.start_timestamp,
        "value": item.no_price * item.reserve_to_usd_rate,
        "type": "NO"
      }
      ]
      if (allow_draw) {
        data.push({
          "date": item.start_timestamp,
          "value": item.draw_price * item.reserve_to_usd_rate,
          "type": "DRAW"
        })
      }
    });
    
    setDataForChart(data);
  }, [candles]);

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

  console.log(reserve_symbol, reserve_asset, reserveView, currentReserveRate)
  // display: 'flex', flexDirection: 'column' 
  return <Link to={`/market/${aa_address}`}>
    <div className={styles.itemWrap}>
      <Row gutter={10}>
        <Col md={{ span: 16 }} xs={{ span: 24 }} sm={{ span: 24 }} ref={infoWrapRef}>
          <Space className={styles.notifyWrap}>
            {category && <span>{category} </span>}<span>Expiration {expirationDateView} ({afterExpirationDateView})</span>
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

        {infoHeight && <Col md={{ span: 8 }} xs={{ span: 24 }} sm={{ span: 24 }} style={{ height: infoHeight, marginRight: '-25px', boxSizing: 'border-box' }}>
          <Line {...config} data={dataForChart} />
        </Col>}
      </Row>
    </div>
  </Link>
}