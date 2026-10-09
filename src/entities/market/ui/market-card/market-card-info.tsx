import { useTranslation } from "react-i18next";
import { cn } from "cn";

import { DRAW_COLOR, NO_COLOR, YES_COLOR } from "@/shared/config/colors";

import type { OutcomeView } from "../../lib/get-market-card-view";
import styles from "./market-card.module.css";

type MarketCardInfoProps = {
  reserveView: number;
  reserveSymbol?: string;
  /** USD value of the reserve, shown while the market is open and prices are displayed. */
  reserveInUsd: number | null;
  allowDraw?: boolean | number;
  priceOrOddsView: string;
  yes: OutcomeView;
  no: OutcomeView;
  draw: OutcomeView;
};

const OutcomeCell = ({ title, color, outcome }: { title: string; color?: string; outcome: OutcomeView }) => (
  <div style={{ color }}>
    <div className={styles.infoTitle}>{title}</div>
    <div style={{ fontSize: 13 }}>{outcome.value}</div>
    {outcome.subValue ? <div className={styles.infoValueInDollar}>{outcome.subValue}</div> : null}
  </div>
);

/** Reserve and outcome prices / odds of a non-sport market. */
export const MarketCardInfo = ({ reserveView, reserveSymbol, reserveInUsd, allowDraw, priceOrOddsView, yes, no, draw }: MarketCardInfoProps) => {
  const { t } = useTranslation();

  return (
    <div className={cn(styles.infoWrap, "grid grid-cols-2 gap-x-2.5 md:grid-cols-4")}>
      <div>
        <div className={styles.infoTitle}>{t("pages.market.cards.reserve.title", "Reserve")}</div>
        <div>
          {reserveView} <small>{reserveSymbol}</small>
        </div>
        {reserveInUsd !== null ? <div className={styles.infoValueInDollar}>${reserveInUsd}</div> : null}
      </div>
      <OutcomeCell title={`${t("common.yes", "yes")} ${priceOrOddsView}`} color={YES_COLOR} outcome={yes} />
      <OutcomeCell title={`${t("common.no", "no")} ${priceOrOddsView}`} color={NO_COLOR} outcome={no} />
      <div>
        {allowDraw ? (
          <div>
            <div className={styles.infoTitle}>
              {t("common.draw", "draw")} {priceOrOddsView}
            </div>
            <div style={{ color: DRAW_COLOR }}>
              <div style={{ fontSize: 13 }}>{draw.value}</div>
              {draw.subValue ? <div className={styles.infoValueInDollar}>{draw.subValue}</div> : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
