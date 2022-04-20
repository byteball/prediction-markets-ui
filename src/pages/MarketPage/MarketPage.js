import { PageHeader, Typography, Row, Col, Space, Button, Statistic, Tooltip, Radio } from "antd"
import { Layout } from "components/Layout/Layout";
import { StatsCard } from "components/StatsCard/StatsCard";
import styles from './MarketPage.module.css';
import { data } from "pages/MainPage/PredictionItem";
import { Line } from '@ant-design/plots';

const config = {
  data,
  xField: 'date',
  yField: 'value',
  seriesField: 'type',
  autoFit: true,
  animation: false,
  renderer: 'svg',
  smooth: true,
  antialias: true,
  appendPadding: 0,
  color: ({ type }) => {
    return type === 'NO' ? '#ffa39e' : type === 'YES' ? '#b7eb8f' : '#ffe58f';
  }
};

export const MarketPage = () => {
  return <Layout>
    <div style={{ marginTop: 50 }}>
      <Space>
        <a href="#">Finance</a> <span>Expiration January 1, 2023</span>
      </Space>
      <h1 style={{ maxWidth: 800 }}>Will $ETH be above $3,000 on April 20, 2022?</h1>

      <Space size='large' style={{ marginBottom: 15 }}>
        <Button type="primary" size="large">Trade</Button>
        <Button type="primary" size="large">Add liquidity</Button>
        <Button size="large">View params</Button>
      </Space>

      <Row className={styles.infoWrap} gutter={30}>
        <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
          <StatsCard title="Yes price" />
        </Col>
        <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
          <StatsCard title="No price" />
        </Col>
        <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
          <StatsCard title="Draw price" />
        </Col>
        <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
          <StatsCard title="Reserve" />
        </Col>

        <Col lg={{ span: 8 }} md={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: 30 }}>
          <StatsCard title="time to expiration" showChart={false} value="42 days 12:54:32" subValue={<span>STATUS: <span style={{ color: 'green', textTransform: 'uppercase' }}>Active trade</span></span>} />
        </Col>

      </Row>

      <div>
        {/* <h2 style={{ marginBottom: 25, marginTop: 35 }}>Comparison chart</h2> */}
        <div style={{ display: 'flex', justifyContent: "flex-end", marginBottom: 10 }}>
          <Radio.Group value='large'>
            <Radio.Button value="large">Prices</Radio.Button>
            <Radio.Button value="default">Supplies</Radio.Button>
          </Radio.Group>
        </div>
        <Line {...config} />
      </div>
      <div>
        <h2 style={{ marginBottom: 25, marginTop: 35 }}>Recent events</h2>
        <div style={{ padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, background: '#b7eb8f', borderRadius: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: "#fff", fontSize: 12, marginRight: 15 }}>
            YES
          </div>
          <div><a href="#">MDKKP...</a> buy 100543 YES tokens</div>
        </div>
        <div style={{ padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, background: '#b7eb8f', borderRadius: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: "#fff", fontSize: 12, marginRight: 15 }}>
            YES
          </div>
          <div><a href="#">MDKKP...</a> buy 100543 YES tokens</div>
        </div>
        <div style={{ padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, background: '#b7eb8f', borderRadius: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: "#fff", fontSize: 12, marginRight: 15 }}>
            YES
          </div>
          <div><a href="#">MDKKP...</a> buy 100543 YES tokens</div>
        </div>
        <div style={{ padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, background: '#b7eb8f', borderRadius: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: "#fff", fontSize: 12, marginRight: 15 }}>
            YES
          </div>
          <div><a href="#">MDKKP...</a> buy 100543 YES tokens</div>
        </div>
      </div>
    </div>
  </Layout>
}