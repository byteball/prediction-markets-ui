import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';

import { InfoTooltip } from 'components/InfoTooltip/InfoTooltip';

import styles from "./StatsCard.module.css";

export const StatsCard = ({ title, tooltip = '', value = <span />, subValue = null, color = '#fff', onAction }) => {
  return <div className={styles.wrap}>
    <div className={styles.title}>{title}</div>
    <div className={styles.value} style={{ color }}>{value}</div>
    <div className={styles.subValueWrap} style={{ color }}>
      <div>{subValue}</div>
      {onAction && <Space size="large">
        <Button size='small' onClick={() => onAction('buy')} className={styles.btn} icon={<DownloadOutlined />} type='link'>buy</Button>
        <Button size='small' onClick={() => onAction('redeem')} className={styles.btn} icon={<UploadOutlined />} type='link'>sell</Button>
      </Space>}
    </div>

    {tooltip && <div className={styles.tooltipWrap}>
      <InfoTooltip title={tooltip} />
    </div>}
  </div>
}
