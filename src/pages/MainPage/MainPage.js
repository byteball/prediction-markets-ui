import { useState } from "react";
import { Col, Row, Spin } from "antd";
import { useSelector } from "react-redux";

import { Layout } from "components/Layout/Layout";
import { PredictionList } from "components/PredictionList/PredictionList";
import { SwitchActions } from "components/SwitchActions/SwitchActions";

import { selectAllMarkets, selectChampionships } from "store/slices/marketsSlice";

import { getTabNameByType } from "utils/getTabNameByType";

import styles from "./MainPage.module.css";

export const MainPage = () => {
  const markets = useSelector(selectAllMarkets);
  const championships = useSelector(selectChampionships);

  const [marketType, setMarketType] = useState('all');

  const sportTypes = Object.keys(championships);

  const switchActionsData = [{ value: 'all', text: 'All' }, { value: 'currency', text: '📈 Currency' }];

  sportTypes.forEach((type) => switchActionsData.push(({ value: type, text: getTabNameByType(type) })))

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
        <SwitchActions value={marketType} data={switchActionsData} onChange={(action) => setMarketType(action)} />

        <div style={{ marginTop: 10 }}>
          <PredictionList type={marketType} />
        </div>
      </div>
    </Layout>
  </div>
}