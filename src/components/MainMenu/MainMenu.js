import { Space } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import styles from "./MainMenu.module.css";

export const MainMenu = ({ direction = "horizontal" }) => {
  const { t } = useTranslation();

  return <Space size="large" align="center" direction={direction}>
    <Link className={styles.menu_item} to="/create">{t("main_menu.create", "Create new market")}</Link>
    <Link className={styles.menu_item} to="/faq">{t("main_menu.faq", "F.A.Q.")}</Link>
  </Space>
}