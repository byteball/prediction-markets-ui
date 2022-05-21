import { Col, Row, Spin } from "antd";
import { useSelector } from "react-redux";

import { PredictionItem } from "./PredictionItem";
import { Layout } from "components/Layout/Layout";
// import { ReactComponent as Select } from './img/select.svg';
import { selectAllMarkets } from "store/slices/marketsSlice";

import styles from "./MainPage.module.css";

export const MainPage = () => {
  const markets = useSelector(selectAllMarkets);

  if (!markets || markets.length === 0) return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Spin size="large" />
    </div>
  )

  return <div>
    <Layout>
      <Row className={styles.headerWrap}>
        <Col xs={{ span: 24 }} md={{ span: 12 }}>
          <h1 className={styles.mainHeader}>
            Decentralized <span className={styles.select}>prediction markets</span> platform
          </h1>
          <div className={styles.description}>
            <p>We support ETH, BNB, MATIC or any Obyte tokens</p>
          </div>
        </Col>

        {/* <Col xs={{ span: 0 }} md={{ span: 12 }} style={{ textAlign: "right" }}>
          <Select style={{ maxWidth: 390, marginLeft: 10 }} />
        </Col> */}
      </Row>

      <div style={{ margin: "0 auto", marginTop: 40, maxWidth: 780, userSelect: 'none' }}>
        {markets.map((data) => <PredictionItem key={`item-${data.aa_address}`} {...data} />)}
      </div>
    </Layout>
  </div>
}