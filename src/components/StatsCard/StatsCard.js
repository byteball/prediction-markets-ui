import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';

import { InfoTooltip } from 'components/InfoTooltip/InfoTooltip';

import styles from "./StatsCard.module.css";

export const StatsCard = ({ title, tooltip = '', value = <span />, toWinValue = null, toWinSubValue = null, subValue = null, color = '#fff', onAction, isWinner, reserve = 0 }) => {
  const winnerExists = isWinner !== undefined;
  const showValue = isWinner || !winnerExists;
  const { t } = useTranslation();

  return <div className={styles.wrap} style={{ overflow: 'hidden' }}>
    {toWinValue ? <div className={styles.titleRow}>
      <div className={styles.titleWithTooltip}>
        <div className={styles.title}>{title}</div>
        {tooltip && <InfoTooltip title={tooltip} />}
      </div>
      <div className={styles.title}>{t('pages.market.cards.to_win', 'To win')}</div>
    </div> : <div className={styles.title}>{title}</div>}
    {showValue && (toWinValue ? <div className={styles.valueRow}>
      <div className={styles.value} style={{ color }}>{value}</div>
      <div className={styles.arrow}>→</div>
      <div className={styles.value} style={{ color, textAlign: 'right' }}>{toWinValue}</div>
    </div> : <div className={styles.value} style={{ color }}>{value}</div>)}
    {isWinner === false && <div className={styles.value} style={{ color }}> </div>}
    {toWinSubValue ? <div className={styles.subValueRow}>
      <div style={{ color }}>{subValue}</div>
      <div style={{ color }}>{toWinSubValue}</div>
    </div> : <div className={styles.subValueWrap} style={{ color: !winnerExists ? color : '#fff' }}>
      {!winnerExists ? <div>{subValue}</div> : (isWinner ? t('common.winner', 'WINNER') : t('common.loser', 'LOSER'))}
      {(onAction && !winnerExists && reserve !== 0) ? <Space size="large">
        <Button size='small' onClick={() => onAction('buy')} className={styles.btn} icon={<DownloadOutlined />} type='link'>{t('common.buy', 'buy')}</Button>
        <Button size='small' onClick={() => onAction('redeem')} className={styles.btn} icon={<UploadOutlined />} type='link'>{t('common.sell', 'sell')}</Button>
      </Space> : null}
    </div>}
    {toWinValue && (onAction && !winnerExists && reserve !== 0) ? <div style={{ marginTop: 4 }}>
      <Space size="large">
        <Button size='small' onClick={() => onAction('buy')} className={styles.btn} icon={<DownloadOutlined />} type='link'>{t('common.buy', 'buy')}</Button>
        <Button size='small' onClick={() => onAction('redeem')} className={styles.btn} icon={<UploadOutlined />} type='link'>{t('common.sell', 'sell')}</Button>
      </Space>
    </div> : null}

    {tooltip && !toWinValue && <div className={styles.tooltipWrap}>
      <InfoTooltip title={tooltip} />
    </div>}

    {isWinner && <img src="/winner-icon.svg" className={styles.winnerIcon} alt="" />}
  </div>
}
