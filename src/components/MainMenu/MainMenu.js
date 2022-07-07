import { Space } from "antd";
import { Link } from "react-router-dom";

import styles from "./MainMenu.module.css";

export const MainMenu = ({ direction = "horizontal" }) => {
  return <Space size="large" align="center" direction={direction}>
    <Link className={styles.menu_item} to="/create">Create new market</Link>
    <Link className={styles.menu_item} to="/faq">F.A.Q.</Link>
  </Space>
}