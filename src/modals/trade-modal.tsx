import { memo, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Helmet } from "react-helmet-async";
import ReactGA from "react-ga4";
import { useTranslation } from "react-i18next";

import { SwitchActions } from "components/switch-actions/switch-actions";
import { BuyForm, RedeemForm } from "forms";
import type { AmountState } from "forms/redeem-form";
import { useAppSelector } from "store/hooks";
import { selectActiveMarketStatus } from "store/slices/active-slice";
import { capitalizeFirstLetter } from "utils";

import { Button } from "components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "components/ui/tooltip";
import { ModalSheet } from "./modal-sheet";

export type TradeModalVisible = false | true | { type: "yes" | "no" | "draw"; action?: "buy" | "redeem" };

type TradeModalProps = {
  disabled?: boolean;
  visible: TradeModalVisible;
  setVisible: Dispatch<SetStateAction<TradeModalVisible>>;
  yes_team?: string;
  no_team?: string;
  reserve?: number;
};

export const TradeModal = memo(({ disabled, visible, setVisible, yes_team, no_team, reserve }: TradeModalProps) => {
  const [action, setAction] = useState<"buy" | "redeem">("buy");

  const status = useAppSelector(selectActiveMarketStatus);
  const [buyAmount, setBuyAmount] = useState<AmountState>({ value: "", valid: true });
  const [redeemAmount, setRedeemAmount] = useState<AmountState>({ value: "", valid: true });
  const { t } = useTranslation();

  const open = () => {
    setVisible(true);

    ReactGA.event({
      category: "user-engagement",
      action: "click-trade",
    });
  };

  useEffect(() => {
    if (visible) {
      const requested = typeof visible === "object" ? visible : undefined;

      if (requested?.action) {
        setAction(requested.action);
      } else {
        setAction("buy");
      }

      if (requested?.action === "buy") {
        ReactGA.event({
          category: "user-engagement",
          action: "click-buy",
          label: requested.type,
        });
      } else if (requested?.action === "redeem") {
        ReactGA.event({
          category: "user-engagement",
          action: "click-sell",
          label: requested.type,
        });
      }
    }
  }, [visible]);

  const type = typeof visible === "object" ? visible.type : undefined;

  return (
    <>
      {visible && <Helmet title={`Prophet prediction markets — ${t("modals.trade.title", "Trade")}`} />}

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
        <Button size="lg" disabled={disabled} onClick={open}>
          {t("modals.trade.title", "Trade")}
        </Button>
      )}

      {status === "loaded" && (
        <ModalSheet open={!!visible} onOpenChange={(isOpen) => setVisible(isOpen ? visible || true : false)} title={t("modals.trade.title", "Trade")}>
          <SwitchActions
            data={[
              { value: "buy", text: capitalizeFirstLetter(t("common.buy", "buy")) },
              { value: "redeem", text: capitalizeFirstLetter(t("common.sell", "sell")) },
            ]}
            onChange={(next) => setAction(next as "buy" | "redeem")}
            value={action}
          />

          {action === "buy" && <BuyForm amount={buyAmount} setAmount={setBuyAmount} type={type} yes_team={yes_team} no_team={no_team} />}

          {action === "redeem" && <RedeemForm amount={redeemAmount} setAmount={setRedeemAmount} type={type} yes_team={yes_team} no_team={no_team} />}
        </ModalSheet>
      )}
    </>
  );
});

TradeModal.displayName = "TradeModal";
