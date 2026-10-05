import type { ReactNode } from "react";
import { Download, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

import { InfoTooltip } from "components/InfoTooltip/InfoTooltip";
import { Button } from "@/components/ui/button";

import styles from "./StatsCard.module.css";

type StatsCardProps = {
  title: ReactNode;
  tooltip?: ReactNode;
  value?: ReactNode;
  toWinValue?: ReactNode;
  toWinSubValue?: ReactNode;
  subValue?: ReactNode;
  color?: string;
  onAction?: (action: "buy" | "redeem") => void;
  isWinner?: boolean;
  reserve?: number;
};

export const StatsCard = ({ title, tooltip = "", value = <span />, toWinValue = null, toWinSubValue = null, subValue = null, color = "#fff", onAction, isWinner, reserve = 0 }: StatsCardProps) => {
  const winnerExists = isWinner !== undefined;
  const showValue = isWinner || !winnerExists;
  const { t } = useTranslation();

  const actions = (
    <div className="flex items-center gap-6">
      <Button size="sm" variant="link" onClick={() => onAction?.("buy")} className={styles.btn}>
        <Download data-icon="inline-start" />
        {t("common.buy", "buy")}
      </Button>
      <Button size="sm" variant="link" onClick={() => onAction?.("redeem")} className={styles.btn}>
        <Upload data-icon="inline-start" />
        {t("common.sell", "sell")}
      </Button>
    </div>
  );

  return (
    <div className={styles.wrap} style={{ overflow: "hidden" }}>
      {toWinValue ? (
        <div className={styles.titleRow}>
          <div className={styles.titleWithTooltip}>
            <div className={styles.title}>{title}</div>
            {tooltip && <InfoTooltip title={tooltip} />}
          </div>
          <div className={styles.title} style={{ opacity: 0.6 }}>
            {t("pages.market.cards.to_win", "To win")}
          </div>
        </div>
      ) : (
        <div className={styles.title}>{title}</div>
      )}
      {showValue &&
        (toWinValue ? (
          <div className={styles.valueRow}>
            <div className={styles.value} style={{ color }}>
              {value}
            </div>
            <div className={styles.arrow} style={{ opacity: 0.6 }}>
              →
            </div>
            <div className={styles.value} style={{ color, textAlign: "right", opacity: 0.6 }}>
              {toWinValue}
            </div>
          </div>
        ) : (
          <div className={styles.value} style={{ color }}>
            {value}
          </div>
        ))}
      {isWinner === false && (
        <div className={styles.value} style={{ color }}>
          {" "}
        </div>
      )}
      {toWinSubValue ? (
        <div className={styles.subValueRow}>
          <div style={{ color }}>{subValue}</div>
          <div style={{ color, opacity: 0.6 }}>{toWinSubValue}</div>
        </div>
      ) : (
        <div className={styles.subValueWrap} style={{ color: !winnerExists ? color : "#fff" }}>
          {!winnerExists ? <div>{subValue}</div> : isWinner ? t("common.winner", "WINNER") : t("common.loser", "LOSER")}
          {onAction && !winnerExists && reserve !== 0 ? actions : null}
        </div>
      )}
      {toWinValue && onAction && !winnerExists && reserve !== 0 ? <div style={{ marginTop: 4 }}>{actions}</div> : null}

      {tooltip && !toWinValue && (
        <div className={styles.tooltipWrap}>
          <InfoTooltip title={tooltip} />
        </div>
      )}

      {isWinner && <img src="/winner-icon.svg" className={styles.winnerIcon} alt="" />}
    </div>
  );
};
