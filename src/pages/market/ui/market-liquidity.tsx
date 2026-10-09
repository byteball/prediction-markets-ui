import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "cn";

import { useAppSelector } from "@/shared/lib/redux";
import { MarketSizePie, selectActiveMarketParams, selectActiveMarketStateVars, selectActiveTeams } from "@/entities/market";
import { AddLiquidityModal } from "@/features/add-liquidity";

import styles from "./market-page.module.css";

type MarketLiquidityProps = {
  apyView: string | number;
  isTradeActive: boolean;
  walletSlot: ReactElement;
};

export const MarketLiquidity = ({ apyView, isTradeActive, walletSlot }: MarketLiquidityProps) => {
  const { t } = useTranslation();
  const params = useAppSelector(selectActiveMarketParams);
  const stateVars = useAppSelector(selectActiveMarketStateVars);
  const teams = useAppSelector(selectActiveTeams);

  const { reserve = 0, result } = stateVars;
  const { reserve_decimals, reserve_symbol, allow_draw } = params;
  const showMarketSizePie = !result && reserve !== 0;

  return (
    <div style={{ marginTop: 50 }}>
      <div className={cn("grid grid-cols-1 items-center justify-between gap-x-2.5", showMarketSizePie && "md:grid-cols-12")}>
        <div className={cn(showMarketSizePie && "md:col-span-6")}>
          <h2 style={{ fontSize: 28 }}>{t("pages.market.apy.title", "Make money from liquidity provision")}</h2>
          <p className="mb-4">
            {reserve !== 0 && <span>{t("pages.market.apy.every_trade", "Every trade is charged a fee which is added to this prediction market’s pool (see the fee accumulation chart above).")} </span>}
            {t("pages.market.apy.earn", "Earn a share of these fees by buying all tokens in the same proportions they are already issued. One of the tokens will win, and you’ll get a share of the trading fees collected after you invested.")}
          </p>
          <p className="mb-4">
            {t("pages.market.apy.by_buying", "By buying all tokens without changing their proportions you are not betting on any outcome but taking a market-neutral position instead and adding liquidity to this prediction market. This is safe if the current proportions reflect the true probabilities.")}
          </p>

          <div className={styles.apyWrap}>
            <div className={styles.apyPanel}>{t("pages.market.apy.block", "Liquidity provision APY since the pool was started: {{percent}}%", { percent: apyView })}</div>
            <div className={styles.apyDesc}>
              {t("pages.market.apy.block_desc", "The APY estimation is for the first LP assuming the trading activity stays the same as it has been so far. Later LPs earn from fewer trades, and the trading activity can change in the future, so the actual APY can be significantly different.")}
            </div>
          </div>

          <AddLiquidityModal walletSlot={walletSlot} disabled={!isTradeActive} yes_team={teams?.yes?.name} no_team={teams?.no?.name} />
        </div>

        {showMarketSizePie && (
          <div className="md:col-span-4 md:col-start-9">
            <div style={{ width: "100%" }}>
              <MarketSizePie teams={teams} reserve_decimals={reserve_decimals} stateVars={stateVars} reserve_symbol={reserve_symbol} allow_draw={allow_draw} oracle={params.oracle} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
