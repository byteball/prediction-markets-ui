import { useState } from "react";
import { Helmet } from "react-helmet-async";
import ReactGA from "react-ga4";
import { useTranslation } from "react-i18next";

import { AddLiquidityForm } from "forms";
import { useAppSelector } from "store/hooks";
import { selectActiveMarketStatus } from "store/slices/activeSlice";

import { Button } from "@/components/ui/button";
import { ModalSheet } from "./ModalSheet";

type AddLiquidityModalProps = {
  disabled?: boolean;
  yes_team?: string;
  no_team?: string;
};

export const AddLiquidityModal = ({ disabled, yes_team, no_team }: AddLiquidityModalProps) => {
  const [visible, setVisible] = useState(false);

  const status = useAppSelector(selectActiveMarketStatus);
  const { t } = useTranslation();

  const open = () => {
    setVisible(true);

    ReactGA.event({
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
          <AddLiquidityForm yes_team={yes_team} no_team={no_team} />
        </ModalSheet>
      )}
    </>
  );
};
