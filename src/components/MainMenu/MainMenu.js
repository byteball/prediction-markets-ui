import { Space } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import styles from "./MainMenu.module.css";
import { useSelector } from "react-redux";
import { selectLanguage } from "store/slices/settingsSlice";

export const MainMenu = ({ direction = "horizontal", onClose = () => { } }) => {
  const { t } = useTranslation();
  const lang = useSelector(selectLanguage);

  const basename = lang && lang !== "en" ? "/" + lang : "";

  return <Space size="large" align="center" direction={direction}>
    <Link className={styles.menu_item} onClick={onClose} to={`${basename}/create`}>{t("main_menu.create", "Create new market")}</Link>
    <Link className={styles.menu_item} onClick={onClose} to={`${basename}/faq`}>{t("main_menu.faq", "F.A.Q.")}</Link>
  </Space>
}