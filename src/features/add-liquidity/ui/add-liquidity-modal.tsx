import { useState, type ReactElement } from "react";
import { Helmet } from "react-helmet-async";
import { track } from "@/shared/lib/analytics/track";
import { useTranslation } from "react-i18next";

import { AddLiquidityForm } from "./add-liquidity-form";
import { useAppSelector } from "@/shared/lib/redux";
import { selectActiveMarketStatus } from "@/entities/market";

import { Button } from "@/shared/ui/button";
import { ModalSheet } from "@/shared/ui/modal-sheet";

type AddLiquidityModalProps = {
  disabled?: boolean;
  yes_team?: string;
  no_team?: string;
  /** Connect-wallet action shown to EVM stakers without a linked Obyte wallet. */
  walletSlot?: ReactElement;
};

export const AddLiquidityModal = ({ disabled, yes_team, no_team, walletSlot }: AddLiquidityModalProps) => {
  const [visible, setVisible] = useState(false);

  const status = useAppSelector(selectActiveMarketStatus);
  const { t } = useTranslation();

  const open = () => {
    setVisible(true);

    track({
      category: "user-engagement",
      action: "click-add-liquidity",
    });
  };

  return (
    <>
      {visible && <Helmet title={`Prophet prediction markets — ${t("modals.add_liquidity.title", "Add liquidity")}`} />}
      <Button size="lg" disabled={disabled} onClick={open}>
        {t("modals.add_liquidity.title", "Add liquidity")}
      </Button>

      {status === "loaded" && (
        <ModalSheet open={visible} onOpenChange={setVisible} title={t("modals.add_liquidity.title", "Add liquidity")}>
          <AddLiquidityForm yes_team={yes_team} no_team={no_team} walletSlot={walletSlot} />
        </ModalSheet>
      )}
    </>
  );
};
