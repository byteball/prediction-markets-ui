import { Col, Row } from "antd";
import { SocialLinks } from "components/SocialLinks/SocialLinks";
import styles from "./Footer.module.css";

export const Footer = () => {
  const year = new Date().getFullYear();

  return <div className={styles.wrap}>
    <div>
      &copy; {year} Obyte. All rights reserved
    </div>
    <div style={{ display: 'flex', justifyContent: 'center' }}><SocialLinks /></div>
  </div>
}