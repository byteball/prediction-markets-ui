import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Img } from "react-image";

import { ClaimProfitForm } from "@/forms";
import { useAppSelector } from "@/store/hooks";
import { selectActiveAddress, selectActiveMarketParams, selectActiveMarketStateVars, selectActiveMarketStatus, selectUserOutcomeBalances } from "@/store/slices/active-slice";
import { selectWalletAddress } from "@/store/slices/settings-slice";

import { Button } from "@/components/ui/button";
import { ModalSheet } from "./modal-sheet";

import styles from "./claim-profit-modal.module.css";

type ClaimProfitModalProps = {
  disabled?: boolean;
  yes_team?: string;
  no_team?: string;
};

export const ClaimProfitModal = ({ disabled, yes_team, no_team }: ClaimProfitModalProps) => {
  const [visible, setVisible] = useState(false);
  const status = useAppSelector(selectActiveMarketStatus);
  const address = useAppSelector(selectActiveAddress);
  const stateVars = useAppSelector(selectActiveMarketStateVars);
  const walletAddress = useAppSelector(selectWalletAddress);
  const outcomeBalances = useAppSelector(selectUserOutcomeBalances);

  const { yes_decimals, no_decimals, draw_decimals, yes_symbol, no_symbol, draw_symbol, reserve_decimals, reserve_symbol, yes_crest_url, no_crest_url, is_tokenless } = useAppSelector(selectActiveMarketParams);

  const { result: winner, supply_yes, supply_no, supply_draw, reserve, yes_asset, no_asset, draw_asset } = stateVars;

  const supply = (winner === "yes" ? supply_yes : winner === "no" ? supply_no : supply_draw) || 0;
  const decimals = (winner === "yes" ? yes_decimals : winner === "no" ? no_decimals : draw_decimals) || 0;
  const asset: string | undefined = winner === "yes" ? yes_asset : winner === "no" ? no_asset : draw_asset;
  const symbol: string | undefined = winner === "yes" ? yes_symbol : winner === "no" ? no_symbol : draw_symbol;
  const outcomeBalance = winner && outcomeBalances ? outcomeBalances[winner] : undefined;
  const winnerView = winner === "yes" ? yes_team || "Yes" : winner === "no" ? no_team || "No" : "Draw";
  const winnerCrest = winner === "yes" ? yes_crest_url : winner === "no" ? no_crest_url : null;

  const { t } = useTranslation();

  return (
    <>
      {visible && <Helmet title={`Prophet prediction markets — ${t("modals.claim_profit.title", "Claim profit")}`} />}
      <Button size="lg" disabled={disabled} onClick={() => setVisible(true)}>
        {t("modals.claim_profit.title", "Claim profit")}
      </Button>
      {status === "loaded" && (
        <ModalSheet open={visible} onOpenChange={setVisible} title={t("modals.claim_profit.title", "Claim profit")}>
          <div className={styles.banner}>
            {winnerCrest && (
              <div className={styles.flagWrap}>
                <Img src={winnerCrest} alt={winnerView} className={styles.flag} />
              </div>
            )}
            <div className={styles.nameRow}>
              <img className={styles.wreath} src="/laurel-wreath.svg" alt="" aria-hidden="true" />
              <span className={`${styles.winnerName} ${winnerCrest ? "" : styles.winnerNameLarge}`}>{winnerView}</span>
              <img className={`${styles.wreath} ${styles.wreathRight}`} src="/laurel-wreath.svg" alt="" aria-hidden="true" />
            </div>
            <div className={styles.winnerLabel}>{t("common.winner", "WINNER")}</div>
          </div>

          <p className={`${styles.desc} mb-4`}>{t("modals.claim_profit.winner_desc", '"{{winner}}" was the right choice and you can collect your winnings', { winner: winnerView })}</p>

          <ClaimProfitForm
            address={address}
            supply={supply}
            reserve={reserve}
            decimals={decimals}
            walletAddress={walletAddress}
            reserve_decimals={reserve_decimals}
            reserve_symbol={reserve_symbol}
            asset={asset}
            symbol={symbol}
            isTokenless={!!is_tokenless}
            outcomeBalance={outcomeBalance}
          />
        </ModalSheet>
      )}
    </>
  );
};
