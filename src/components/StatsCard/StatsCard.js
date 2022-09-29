import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';

import { InfoTooltip } from 'components/InfoTooltip/InfoTooltip';

import styles from "./StatsCard.module.css";

export const StatsCard = ({ title, tooltip = '', value = <span />, subValue = null, color = '#fff', onAction, isWinner, reserve = 0 }) => {
  const winnerExists = isWinner !== undefined;
  const showValue = isWinner || !winnerExists;
  const { t } = useTranslation();

  return <div className={styles.wrap} style={{ overflow: 'hidden' }}>
    <div className={styles.title}>{title}</div>
    {showValue && <div className={styles.value} style={{ color }}>{value}</div>}
    {isWinner === false && <div className={styles.value} style={{ color }}> </div>}
    <div className={styles.subValueWrap} style={{ color: !winnerExists ? color : '#fff' }}>
      {!winnerExists ? <div>{subValue}</div> : (isWinner ? t('common.winner', 'WINNER') : t('common.loser', 'LOSER'))}
      {(onAction && !winnerExists && reserve !== 0) ? <Space size="large">
        <Button size='small' onClick={() => onAction('buy')} className={styles.btn} icon={<DownloadOutlined />} type='link'>{t('common.buy', 'buy')}</Button>
        <Button size='small' onClick={() => onAction('redeem')} className={styles.btn} icon={<UploadOutlined />} type='link'>{t('common.sell', 'sell')}</Button>
      </Space> : null}
    </div>

    {tooltip && <div className={styles.tooltipWrap}>
      <InfoTooltip title={tooltip} />
    </div>}

    {isWinner && <img src="/winner-icon.svg" className={styles.winnerIcon} alt="" />}
  </div>
}
