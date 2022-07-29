import moment from 'moment';

import { SocialLinks } from "components/SocialLinks/SocialLinks";

import styles from "./Footer.module.css";

export const Footer = () => {
  const year = new Date().getFullYear();
  const timeZone = moment().utcOffset() / 60;

  return <div className={styles.wrap}>
    <div className={styles.timeZoneWrap}>
      <small style={{ fontWeight: 300 }}> All dates are in your local timezone (GMT{timeZone >= 0 ? '+' : '-'}{timeZone}) unless indicated otherwise</small>
    </div>
    <div>
      &copy; {year} Obyte. All rights reserved
    </div>
    <div className={styles.socialWrap}>
      <SocialLinks centered />
    </div>
  </div>
}