import { Col, Row, Spin } from "antd";
import { useSelector } from "react-redux";

import { PredictionItem } from "./PredictionItem";
import { Layout } from "components/Layout/Layout";
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
        <Col xs={{ span: 24 }} md={{ span: 24 }}>
          <h1 className={styles.mainHeader}>
            Decentralized <span className={styles.select}>prediction markets</span> platform
          </h1>
          <div className={styles.description}>
            <p>We support ETH, BNB, MATIC or any Obyte tokens</p>
          </div>
        </Col>
      </Row>

      <div style={{ margin: "0 auto", marginTop: 40, maxWidth: 780, userSelect: 'none' }}>
        {markets.map((data) => <PredictionItem key={`item-${data.aa_address}`} {...data} />)}
      </div>
    </Layout>
  </div>
}