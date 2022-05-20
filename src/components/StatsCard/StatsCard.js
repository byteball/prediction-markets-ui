import { InfoTooltip } from 'components/InfoTooltip/InfoTooltip';

import styles from "./StatsCard.module.css";

export const StatsCard = ({ title, desc = 'info', value = <span />, subValue = null }) => {
  return <div className={styles.wrap}>
    <div>
      <div className={styles.title}>{title}</div>
      <div className={styles.value}>{value}</div>
      <div>{subValue}</div>
    </div>
    <div className={styles.tooltipWrap}><InfoTooltip title={desc} /></div>
  </div>
}
