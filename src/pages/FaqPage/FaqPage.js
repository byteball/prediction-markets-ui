import { DownOutlined } from "@ant-design/icons";
import { Typography, Collapse } from "antd";
import { Layout } from "components/Layout/Layout";
import styles from "./FaqPage.module.css";

const { Panel } = Collapse;

export const FaqPage = () => <Layout>
  <Typography.Title level={1}>F.A.Q.</Typography.Title>
  <div className="faq">
    <Collapse
      ghost
      accordion
      className={styles.collapse}
      expandIconPosition="right" expandIcon={({ isActive }) => (
        <DownOutlined rotate={isActive ? 180 : 0} className={styles.icon} />
      )}
    >
      <Panel header="Lorem Ipsum is simply dummy text of the " key="1">
        <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, </p>
      </Panel>
      <Panel header="Lorem Ipsum is simply dummy text of the " key="2">
        <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, </p>
      </Panel>
      <Panel header="Lorem Ipsum is simply dummy text of the " key="3">
        <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, </p>
      </Panel>

      <Panel header="Lorem Ipsum is simply dummy text of the " key="4">
        <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, </p>
      </Panel>
      <Panel header="Lorem Ipsum is simply dummy text of the " key="5">
        <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, </p>
      </Panel>
      <Panel header="Lorem Ipsum is simply dummy text of the " key="6">
        <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, </p>
      </Panel>

    </Collapse>
  </div>
  <div style={{ marginTop: 20 }}>Other questions? Ask on <a href="https://discord.obyte.org" target="_blank" rel="noopener">Obyte discord</a>.</div>
</Layout>