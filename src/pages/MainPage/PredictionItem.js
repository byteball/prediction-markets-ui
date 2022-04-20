import { Line } from '@ant-design/plots';
import { useEffect, useRef, useState } from "react";
import { Col, Row, Space, Tooltip } from "antd";
import { Link } from "react-router-dom";

import styles from "./PredictionItem.module.css";

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
  data,
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

export const PredictionItem = () => {
  const infoWrapRef = useRef();
  const [infoHeight, setInfoHeight] = useState();
  // console.log(infoWrapRef);

  useEffect(() => {
    const height = infoWrapRef.current.clientHeight;
    if (height) {
      setInfoHeight(height);
    }
  }, [infoWrapRef.current]);
  // display: 'flex', flexDirection: 'column' 
  return <Link to='/market'>
    <div className={styles.itemWrap}>
      <Row gutter={10}>
        <Col md={{ span: 16 }} xs={{ span: 24 }} sm={{ span: 24 }} ref={infoWrapRef}>
          <Space className={styles.notifyWrap}>
            <span>Finance</span> <span>Expiration January 1, 2023 (after 5 months and 10 days)</span>
          </Space>
          <div className={styles.eventDesc}>
            Will $ETH be above $3,000 on April 20, 2022?
          </div>

          <Row className={styles.infoWrap} gutter={10}>
            <Col md={{ span: 6 }} xs={{ span: 12 }}>
              <Tooltip title="reserve">
                <div className={styles.infoTitle}>reserve</div>
                <div style={{fontSize: 16, fontWeight: 500}}>$9253</div>
                <div className={styles.infoValueInCrypto}>205.923123 GBYTE</div>
              </Tooltip>
            </Col>
            <Col md={{ span: 6 }} xs={{ span: 12 }}>
              <Tooltip title="yes price">
                <div className={styles.infoTitle}>yes price</div>
                <div>$953</div>
                <div className={styles.infoValueInCrypto}>55.923123 GBYTE</div>
              </Tooltip>
            </Col>
            <Col md={{ span: 6 }} xs={{ span: 12 }}>
              <Tooltip title="no price">
                <div className={styles.infoTitle}>no price</div>
                <div>$923</div>
                <div className={styles.infoValueInCrypto}>55.923123 GBYTE</div>
              </Tooltip>
            </Col>
            <Col md={{ span: 6 }} xs={{ span: 12 }}>
              <Tooltip title="draw price">
                <div className={styles.infoTitle}>draw price</div>
                <div>$193</div>
                <div className={styles.infoValueInCrypto}>5.923123 GBYTE</div>
              </Tooltip>
            </Col>
          </Row>
        </Col>

        {infoHeight && <Col md={{ span: 8 }} xs={{ span: 24 }} sm={{ span: 24 }} style={{ height: infoHeight, marginRight: '-25px', boxSizing: 'border-box' }}>
          <Line {...config} />
        </Col>}
      </Row>
    </div>
  </Link>
}