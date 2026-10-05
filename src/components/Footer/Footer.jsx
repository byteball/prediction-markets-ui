import moment from 'moment';
import { Trans, useTranslation } from 'react-i18next';

import { SocialLinks } from "components/SocialLinks/SocialLinks";

import styles from "./Footer.module.css";

export const Footer = () => {
  const timeZone = moment().utcOffset() / 60;
  const timeZoneView = `${timeZone >= 0 ? '+' : '-'}${timeZone}`;

  useTranslation();

  return <div className={styles.wrap}>
    <div className={styles.timeZoneWrap}>
      <small> <Trans i18nKey="footer.time_zone">All dates are in your local timezone (UTC{{ timeZoneView }}) unless indicated otherwise</Trans></small>
    </div>
    <div className={styles.disclaimer}>
      <Trans i18nKey="footer.disclaimer">
        The Prophet.ooo website (“Site”) is for informational and educational purposes only. The Site displays the existing prediction markets deployed on the Obyte DAG and is a graphical user interface for both visualizing data from on-chain activity and interacting with autonomous agents directly from your own wallets.
        Prophet.ooo takes no custody of users' crypto assets and does not host or resolve any markets. The Site makes best effort to ensure
        accuracy of the displayed information however there are no guarantees of accuracy and the information is provided as is. None of the material on the Site is intended to be, nor does it constitute, a solicitation, recommendation or offer to buy or sell any security, commodity, interest, derivative, financial product or instrument. Users are responsible for complying with all applicable laws and should conduct their own analysis and consult with professional advisors prior to engaging with any markets.
      </Trans>
    </div>
    <div className={styles.copy}>
      <Trans i18nKey="footer.copy">
        <a className={styles.name} href="https://obyte.org" target="_blank" rel="noopener">Built on Obyte</a>
      </Trans>
    </div>
    <div className={styles.socialWrap}>
      <SocialLinks centered />
    </div>
  </div>
}