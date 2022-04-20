import { PredictionItem } from "./PredictionItem";
import { Layout } from "components/Layout/Layout";
import { Button, Col, Input, Row, Space, Typography } from "antd";
import { ReactComponent as Select } from './img/select.svg';
import { FilterOutlined, PlusOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

export const MainPage = () => {
  return <div>
    <Layout>
      <Row style={{ marginTop: 80 }} gutter={50}>
        <Col span={12}>
          <h1 style={{ textTransform: "uppercase", fontSize: 36, fontWeight: "bold", lineHeight: 1.3 }}>
            Decentralized <span style={{ color: "#0037ff", display: "block" }}>prediction markets</span> platform
          </h1>
          <div style={{ fontSize: 18 }}>
            <p>We support ETH, BNB, MATIC or any Obyte tokens</p>
          </div>
        </Col>

        <Col span={12} style={{ textAlign: "right" }}>
          <Select style={{ maxWidth: 390 }} />
        </Col>
      </Row>
      <div style={{ margin: "0 auto", marginTop: 80, maxWidth: 900, userSelect: 'none' }}>
        <Row style={{ marginBottom: 25 }}>
          <Col flex={1}>
            <Space size={16} style={{ width: "100%" }}>
              <Button  icon={<FilterOutlined />}>Filters</Button>
              <Input  style={{ width: '100%' }} placeholder="Search" />
            </Space>
          </Col>
          <Col>
            <Link to="/create"><Button icon={<PlusOutlined />} >Add market</Button></Link>
          </Col>
        </Row>
        <Typography.Title level={3}>Active markets</Typography.Title>
        <PredictionItem />
        <PredictionItem />
        <PredictionItem />
{/* 
        <Typography.Title level={3}>Closed markets</Typography.Title>
        <PredictionItem />
        <PredictionItem /> */}
      </div>
    </Layout>
  </div>
}