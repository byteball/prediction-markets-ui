import {  Row, Col, Space, Button } from "antd";
import { Link } from "react-router-dom";

import styles from "./Header.module.css";

export const Header = () => {
  return <div style={{ padding: "20px", fontSize: 16 }}>
    <div className="container">
      <Row align="middle" justify="space-between">
        <Col>
          <Link to="/" style={{ color: "#333" }}>
            site name
          </Link>
        </Col>
        <Col>
          <div style={{ verticalAlign: "middle" }}>
            <Space size="large" align="center">
              <Link className={styles.menu_item} to="/">Home</Link>
              <Link className={styles.menu_item} to="/create">Create</Link>
              <Link className={styles.menu_item} to="/how-it-work">How it work</Link>
              <Link className={styles.menu_item} to="/about">About</Link>
            </Space>
          </div>
        </Col>
        <Col>
          <Button size="large" type="primary">WALLET</Button>
        </Col>
      </Row>
    </div>
  </div>
}