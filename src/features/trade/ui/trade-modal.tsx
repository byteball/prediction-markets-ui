import { memo, useEffect, useState, type ReactElement } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

import { SwitchActions } from "@/shared/ui/switch-actions/switch-actions";
import { Button } from "@/shared/ui/button";
import { ModalSheet } from "@/shared/ui/modal-sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { useAppSelector } from "@/shared/lib/redux";
import { capitalizeFirstLetter } from "@/shared/lib/capitalize-first-letter";
import { track } from "@/shared/lib/analytics/track";
import { selectActiveMarketStatus } from "@/entities/market";

import { useTradeDialog, type TradeAction } from "../model/trade-dialog-context";
import { BuyForm } from "./buy-form";
import { RedeemForm, type AmountState } from "./redeem-form";

type TradeModalProps = {
  disabled?: boolean;
  yes_team?: string;
  no_team?: string;
  reserve?: number;
  /** Connect-wallet action shown to EVM stakers without a linked Obyte wallet. */
  walletSlot?: ReactElement;
};

const EMPTY_AMOUNT: AmountState = { value: "", valid: true };

/** The dialog itself; keyed by market so its form state resets when another market opens. */
const TradeDialog = ({ yes_team, no_team, walletSlot }: Pick<TradeModalProps, "yes_team" | "no_team" | "walletSlot">) => {
  const { isOpen, request, close } = useTradeDialog();
  const [action, setAction] = useState<TradeAction>("buy");
  const [buyAmount, setBuyAmount] = useState<AmountState>(EMPTY_AMOUNT);
  const [redeemAmount, setRedeemAmount] = useState<AmountState>(EMPTY_AMOUNT);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;

    setAction(request?.action ?? "buy");

    if (request?.action === "buy") {
      track({ category: "user-engagement", action: "click-buy", label: request.type });
    } else if (request?.action === "redeem") {
      track({ category: "user-engagement", action: "click-sell", label: request.type });
    }
  }, [isOpen, request]);

  return (
    <>
      {isOpen && <Helmet title={`Prophet prediction markets — ${t("modals.trade.title", "Trade")}`} />}
      <ModalSheet open={isOpen} onOpenChange={(open) => !open && close()} title={t("modals.trade.title", "Trade")}>
        <SwitchActions
          data={[
            { value: "buy", text: capitalizeFirstLetter(t("common.buy", "buy")) },
            { value: "redeem", text: capitalizeFirstLetter(t("common.sell", "sell")) },
          ]}
          onChange={(next) => setAction(next as TradeAction)}
          value={action}
        />

        {action === "buy" && <BuyForm amount={buyAmount} setAmount={setBuyAmount} type={request?.type} yes_team={yes_team} no_team={no_team} walletSlot={walletSlot} />}
        {action === "redeem" && <RedeemForm amount={redeemAmount} setAmount={setRedeemAmount} type={request?.type} yes_team={yes_team} no_team={no_team} />}
      </ModalSheet>
    </>
  );
};

/** "Trade" button plus the buy/sell dialog of the opened market. Needs a TradeDialogProvider above. */
export const TradeModal = memo(({ disabled, yes_team, no_team, reserve, walletSlot }: TradeModalProps) => {
  const { marketAddress, open } = useTradeDialog();
  const status = useAppSelector(selectActiveMarketStatus);
  const { t } = useTranslation();

  const handleOpen = () => {
    open();
    track({ category: "user-engagement", action: "click-trade" });
  };

  return (
    <>
      {reserve === 0 && !disabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button size="lg" disabled={true}>
                {t("modals.trade.title", "Trade")}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("modals.trade.liquidity_first", "Please add liquidity first")}</TooltipContent>
        </Tooltip>
      ) : (
        <Button size="lg" disabled={disabled} onClick={handleOpen}>
          {t("modals.trade.title", "Trade")}
        </Button>
      )}

      {status === "loaded" && <TradeDialog key={marketAddress ?? ""} yes_team={yes_team} no_team={no_team} walletSlot={walletSlot} />}
    </>
  );
});

TradeModal.displayName = "TradeModal";
